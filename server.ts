import fs from 'fs';
import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    }
    supabaseAdminClient = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return supabaseAdminClient;
}


async function syncDaysBackgroundJob() {
  try {
    const adminClient = getSupabaseAdmin();
    // 1. Sync accepted_shipments
    const { data: shipments, error: err1 }: any = await adminClient
      .from('accepted_shipments')
      .select('id, created_at, days')
      .not('days', 'is', null);

    if (shipments) {
      for (const ship of shipments) {
        if (ship.created_at) {
          const diff = new Date().getTime() - new Date(ship.created_at).getTime();
          let calculatedDays = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (calculatedDays < 1) calculatedDays = 1;
          const currentDays = parseInt(ship.days || '0', 10);
          if (calculatedDays !== currentDays && calculatedDays > 0) {
             await (adminClient.from('accepted_shipments') as any).update({ days: calculatedDays } as any).eq('id', ship.id);
          }
        }
      }
    }

    // 2. Sync selller_income_estimate
    let estimates: any[] = [];
    try {
      const { data } = await adminClient
        .from('selller_income_estimate')
        .select('id, created_at, days')
        .not('days', 'is', null);
      if (data) estimates = data;
    } catch (e) {
      // ignore
    }

    if (estimates) {
      for (const est of estimates) {
        if (est.created_at) {
          const diff = new Date().getTime() - new Date(est.created_at).getTime();
          let calculatedDays = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (calculatedDays < 1) calculatedDays = 1;
          const currentDays = parseInt(est.days || '0', 10);
          if (calculatedDays !== currentDays && calculatedDays > 0) {
             await (adminClient.from('selller_income_estimate') as any).update({ days: calculatedDays } as any).eq('id', est.id);
          }
        }
      }
    }
    
    // 3. Sync customer_orders
    let orders: any[] = [];
    try {
      const { data } = await adminClient
        .from('customer_orders')
        .select('id, created_at, days')
        .not('days', 'is', null);
      if (data) orders = data;
    } catch (e) {}

    if (orders) {
      for (const ord of orders) {
        if (ord.created_at) {
          const diff = new Date().getTime() - new Date(ord.created_at).getTime();
          let calculatedDays = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (calculatedDays < 1) calculatedDays = 1;
          const currentDays = parseInt(ord.days || '0', 10);
          if (calculatedDays !== currentDays && calculatedDays > 0) {
             await (adminClient.from('customer_orders') as any).update({ days: calculatedDays } as any).eq('id', ord.id);
          }
        }
      }
    }

    // 4. Sync order ID from accepted_shipments to selller_income_estimate
    try {
      const [{ data: accShipments }, { data: allEstimates }]: any = await Promise.all([
        adminClient.from('accepted_shipments').select('id, "order ID", "awb number", "product id", "selller id"').not('order ID', 'is', null),
        adminClient.from('selller_income_estimate').select('id, "order id", "awb number", "product id", "seller id"')
      ]);

      if (accShipments && allEstimates) {
        for (const ship of accShipments) {
          const ordId = ship['order ID'];
          if (!ordId) continue;
          const matching = allEstimates.filter((e: any) => 
            (ship['awb number'] && e['awb number'] && e['awb number'] === ship['awb number']) ||
            (ship.id && e.id && ship.id === e.id)
          );
          for (const est of matching) {
            if (est['order id'] !== ordId) {
              await (adminClient.from('selller_income_estimate') as any).update({ 'order id': ordId }).eq('id', est.id);
            }
          }
        }
      }
    } catch (syncOrdErr) {
      console.error("Error syncing accepted_shipments order ID to selller_income_estimate:", syncOrdErr);
    }
  } catch (err: any) {
    console.error("Background sync error:", err);
  }
}

function setupAcceptedShipmentsRealtimeSync() {
  try {
    const adminClient = getSupabaseAdmin();
    adminClient.channel('realtime:accepted_shipments_order_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accepted_shipments' }, async (payload: any) => {
        const newRecord = payload.new;
        if (!newRecord || !newRecord['order ID']) return;
        const newOrderId = newRecord['order ID'];
        const awb = newRecord['awb number'];
        const shipId = newRecord.id;

        if (awb) {
          await (adminClient.from('selller_income_estimate') as any).update({ 'order id': newOrderId }).eq('awb number', awb);
        } else if (shipId) {
          await (adminClient.from('selller_income_estimate') as any).update({ 'order id': newOrderId }).eq('id', shipId);
        }
      })
      .subscribe();
  } catch (e) {
    console.error("Error setting up accepted_shipments realtime sync:", e);
  }
}

// Start the background job every 10 minutes

let activeAITasks = [];
try {
  if (fs.existsSync('/tmp/ai_tasks.json')) {
    activeAITasks = JSON.parse(fs.readFileSync('/tmp/ai_tasks.json', 'utf-8'));
  }
} catch(e) {}

function saveAITasks() {
  fs.writeFileSync('/tmp/ai_tasks.json', JSON.stringify(activeAITasks));
}

async function runAiBackgroundTasks() {
  if (activeAITasks.length === 0) return;
  try {
    const adminClient = getSupabaseAdmin();
    let tasksUpdated = false;
    
    for (const task of activeAITasks) {
      try {
        const intervalSeconds = task.intervalSeconds || task.interval_seconds || 5;
        const intervalMs = intervalSeconds * 1000;
        
        if (task.lastRunTime && (Date.now() - task.lastRunTime) < intervalMs) {
           continue; // Skip because interval hasn't elapsed yet
        }
        
        task.lastRunTime = Date.now();
        tasksUpdated = true;

        if (task.task === 'AUTO_ANNOUNCE' || task === 'AUTO_ANNOUNCE') {
           const payload = task.payload || task || {};
           const audience = payload.audience || 'all';
           
           let messageText = 'Announcement';
           if (payload.messages && Array.isArray(payload.messages) && payload.messages.length > 0) {
              task.currentMessageIdx = ((task.currentMessageIdx || 0) + 1) % payload.messages.length;
              messageText = payload.messages[task.currentMessageIdx];
           } else {
              messageText = payload.message || 'Announcement';
           }

           const updateTypes = audience === 'customers' ? ['customer_update'] 
                        : audience === 'sellers' ? ['seller_update'] 
                        : audience === 'riders' ? ['rider_update']
                        : audience === 'hub_managers' ? ['hub_manager_update']
                        : audience === 'clusters' ? ['cluster_update']
                        : ['customer_update', 'seller_update', 'rider_update', 'hub_manager_update', 'cluster_update'];
           
           for (const updateType of updateTypes) {
             const messageData = {
               text: messageText,
               fileUrl: null,
               fileName: null,
               timestamp: new Date().toISOString()
             };
             const insertPayload = {
                [updateType]: JSON.stringify(messageData)
             };
             await (adminClient.from('announcement_and_update') as any).insert([insertPayload]);
           }
        }

        if (task === 'AUTO_APPROVE_ALL' || task.task === 'AUTO_APPROVE_ALL') {
          const { data: riders } = await adminClient.from('riders_for_approval').select('*');
          if (riders && riders.length > 0) {
            for (const r of riders) {
              await (adminClient.from('riders') as any).upsert([r], { onConflict: 'id' });
              await (adminClient.from('riders_for_approval') as any).delete().eq('id', (r as any).id);
            }
          }
          const { data: sellers } = await adminClient.from('sellers_for_approval').select('*');
          if (sellers && sellers.length > 0) {
            for (const s of sellers) {
              await (adminClient.from('sellers') as any).upsert([s], { onConflict: 'id' });
              await (adminClient.from('sellers_for_approval') as any).delete().eq('id', (s as any).id);
            }
          }
        }
        
        if (task === 'AUTO_PAY_ALL' || task.task === 'AUTO_PAY_ALL') {
           const { data: rshipments } = await adminClient.from('rider_shipment_work_flow').select('*');
           if (rshipments && rshipments.length > 0) {
             const riderGroups: Record<string, any> = {};
             for (const r of rshipments) {
               const rid = (r as any).rider_id;
               if (!riderGroups[rid]) riderGroups[rid] = { total: 0, rows: [] };
               riderGroups[rid].total += (parseFloat((r as any).delivery_charges) || 0);
               (r as any)['payout status'] = 'settled';
               riderGroups[rid].rows.push(r);
             }
             for (const [rId, group] of Object.entries(riderGroups)) {
               await (adminClient.from('settled_rider_shipments') as any).insert(group.rows);
               await (adminClient.from('rider_shipment_work_flow') as any).delete().eq('rider_id', rId);
               await (adminClient.from('finished_riders_payable_amount') as any).insert([{
                 'rider id': rId,
                 'total amount': group.total.toString(),
                 'total settled amount': group.total.toString(),
                 'penalty amount': '0',
                 'penalty status': 'N/A',
                 'final Settlement status': 'settled'
               }]);
             }
           }
           
           const { data: s_estimates } = await adminClient.from('selller_income_estimate').select('*').eq('payout status', 'Pending');
           if (s_estimates && s_estimates.length > 0) {
             const sellerGroups: Record<string, any> = {};
             for (const s of s_estimates) {
               const sid = (s as any)['seller id'];
               if (!sellerGroups[sid]) sellerGroups[sid] = { total: 0, rows: [] };
               sellerGroups[sid].total += (parseFloat((s as any)['seller income']) || 0);
               (s as any)['payout status'] = 'settled';
               sellerGroups[sid].rows.push(s);
             }
             for (const [sId, group] of Object.entries(sellerGroups)) {
               await (adminClient.from('settled_selller_income_estimate') as any).insert(group.rows);
               await (adminClient.from('selller_income_estimate') as any).update({ 'payout status': 'settled' }).eq('seller id', sId).eq('payout status', 'Pending');
               await (adminClient.from('finished_sellers_payable_amount') as any).insert([{
                 'seller id': sId,
                 'total amount': group.total.toString(),
                 'total settled amount': group.total.toString(),
                 'penalty amount': '0',
                 'penalty status': 'N/A',
                 'final Settlement status': 'settled'
               }]);
             }
           }
        }

        if (task.task === 'DYNAMIC_AI_EVALUATION') {
           const promptCondition = (task.payload && task.payload.condition) || "Analyze the state and perform actions";
           const apiKey = process.env.GEMINI_API_KEY;
           if (apiKey) {
              const { data: pendingRiders } = await adminClient.from('riders_for_approval').select('*');
              const { data: pendingSellers } = await adminClient.from('sellers_for_approval').select('*');
              
              const evalContext = `
              LIVE STATE:
              - Pending Riders Count: ${pendingRiders?.length || 0}
              - Pending Sellers Count: ${pendingSellers?.length || 0}
              `;

              const ai = new GoogleGenAI({ apiKey });
              const systemInstruction = `You are an autonomous background worker AI for the Admin Portal.
Your job is to evaluate a condition and return JSON actions if the condition is met.
User's Condition to evaluate: "${promptCondition}"
${evalContext}

If the condition is MET based on the live state, return JSON in this exact format:
{ "actions": [ { "type": "CREATE_ANNOUNCEMENT", "message": "...", "audience": "all" }, { "type": "AUTO_APPROVE_ALL" } ] }
Allowed action types: CREATE_ANNOUNCEMENT (requires 'message' and 'audience'), AUTO_APPROVE_ALL, AUTO_PAY_ALL.
If the condition is NOT met, return an empty actions array:
{ "actions": [] }`;
              
              try {
                const res = await ai.models.generateContent({
                    model: 'gemini-3.1-pro-preview',
                    contents: "Evaluate the condition and return JSON.",
                    config: { systemInstruction, responseMimeType: 'application/json' }
                });
                
                const parsed = JSON.parse(res.text || '{}');
                if (parsed.actions && Array.isArray(parsed.actions) && parsed.actions.length > 0) {
                   for (const action of parsed.actions) {
                      // Execute basic actions dynamically
                      if (action.type === 'AUTO_APPROVE_ALL') {
                         const { data: r } = await adminClient.from('riders_for_approval').select('*');
                         if (r && r.length > 0) {
                           for (const row of r) {
                             await (adminClient.from('riders') as any).upsert([row], { onConflict: 'id' });
                             await (adminClient.from('riders_for_approval') as any).delete().eq('id', (row as any).id);
                           }
                         }
                         const { data: s } = await adminClient.from('sellers_for_approval').select('*');
                         if (s && s.length > 0) {
                           for (const row of s) {
                             await (adminClient.from('sellers') as any).upsert([row], { onConflict: 'id' });
                             await (adminClient.from('sellers_for_approval') as any).delete().eq('id', (row as any).id);
                           }
                         }
                      } else if (action.type === 'CREATE_ANNOUNCEMENT') {
                         const audience = action.audience || 'all';
                         const messageText = action.message || 'Announcement';
                         const updateTypes = audience === 'customers' ? ['customer_update'] : audience === 'sellers' ? ['seller_update'] : audience === 'riders' ? ['rider_update'] : audience === 'hub_managers' ? ['hub_manager_update'] : audience === 'clusters' ? ['cluster_update'] : ['customer_update', 'seller_update', 'rider_update', 'hub_manager_update', 'cluster_update'];
                         for (const updateType of updateTypes) {
                           await (adminClient.from('announcement_and_update') as any).insert([{ [updateType]: JSON.stringify({ text: messageText, fileUrl: null, fileName: null, timestamp: new Date().toISOString() }) }]);
                         }
                      }
                   }
                }
              } catch (e) {
                 console.error("Dynamic evaluation failed:", e);
              }
           }
        }
      } catch (innerErr: any) {
        console.error("AI Background specific task error:", task, innerErr.message);
      }
    }
    
    if (tasksUpdated) {
      saveAITasks();
    }
  } catch (err: any) {
    console.error("AI Background loop failed:", err.message);
  }
}

setInterval(runAiBackgroundTasks, 2000); // run every 2 seconds for better interval resolution

setInterval(syncDaysBackgroundJob, 10 * 60 * 1000);
// Also run it once on startup after 5 seconds
setTimeout(() => {
  syncDaysBackgroundJob();
  setupAcceptedShipmentsRealtimeSync();
}, 5000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // =========================================================================
  // 1. SURIYAWAN 360° OMNIDIRECTIONAL SECURITY SHIELD & PROTECTOR
  // =========================================================================
  app.use((req, res, next) => {
    // OWASP & Frame Protection Headers
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Shield-Protector', 'Suriyawan-OmniProtect-v9');

    // 2. Anti-Code-Download & Honeypot Scraper Trap:
    // If any bot or attacker attempts to directly download source files or git/config
    const url = req.url.toLowerCase();
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isScraperBot = userAgent.includes('httrack') || 
                         userAgent.includes('teleport') || 
                         userAgent.includes('offline') || 
                         userAgent.includes('webcopy') || 
                         userAgent.includes('sitevault');

    const isProd = process.env.NODE_ENV === 'production';
    const isSensitiveSourceFile = url.includes('.env') || 
                                  url.includes('.git') || 
                                  url.includes('/tsconfig') || 
                                  url.includes('/package.json') || 
                                  url.includes('/setup supabase') ||
                                  (isProd && url.startsWith('/src/')) ||
                                  url.endsWith('.map');

    if (isScraperBot || isSensitiveSourceFile) {
      // Return scrambled random junk decoy code to prevent original source code theft
      const randomHex1 = Math.random().toString(36).substring(2, 15);
      const randomHex2 = Math.random().toString(36).substring(2, 15);
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      return res.status(200).send(`/* [SURIYAWAN CORE ENCRYPTION SHIELD - ACCESS DENIED] */
/* ERROR 0x8849F2: Corrupted binary bundle stream */
(function(_0x${randomHex1}, _0x${randomHex2}){
  var _decoy=['\\x63\\x6f\\x64\\x65\\x5f\\x6c\\x6f\\x63\\x6b\\x65\\x64','\\x73\\x65\\x63\\x75\\x72\\x69\\x74\\x79\\x5f\\x73\\x68\\x69\\x65\\x6c\\x64'];
  while(true){ try { var x=0xDEADBEEF; break; } catch(e){} }
})('0x${randomHex1}','0x${randomHex2}');
// JUNK_CODE_DECOY_BURST: ${Array.from({ length: 20 }, () => '0x' + Math.floor(Math.random() * 0xFFFFFF).toString(16)).join(' ')}
console.warn("Security Alert: Direct source code extraction is strictly prohibited.");`);
    }

    next();
  });

  // =========================================================================
  // 2. SEO & GOOGLE SEARCH CONSOLE ENDPOINTS (Customer Portal Indexing)
  // =========================================================================
  // Robots.txt: Allows customer shopping pages, blocks private admin/cluster/seller portals
  app.get("/robots.txt", (req, res) => {
    const domain = req.protocol + "://" + req.get("host");
    const robotsContent = `User-agent: *
Allow: /
Allow: /customer
Allow: /customer/*
Disallow: /admin
Disallow: /admin/*
Disallow: /cluster
Disallow: /cluster/*
Disallow: /seller
Disallow: /seller/*
Disallow: /hub
Disallow: /hub/*
Disallow: /rider
Disallow: /rider/*
Disallow: /api/

Sitemap: ${domain}/sitemap.xml
`;
    res.setHeader("Content-Type", "text/plain");
    res.send(robotsContent);
  });

  // Sitemap.xml: For Google Search Console verification & crawler indexing
  app.get("/sitemap.xml", (req, res) => {
    const domain = req.protocol + "://" + req.get("host");
    const today = new Date().toISOString().split("T")[0];
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/customer</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
    res.setHeader("Content-Type", "application/xml");
    res.send(sitemapContent);
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/log_error", (req, res) => {
    console.error("Client Error:", req.body);
    res.json({ success: true });
  });

  let latestCustomerPushNotification: any = null;

  app.post("/api/admin/push-product-notification", async (req, res) => {
    try {
      const { product } = req.body;
      if (!product) return res.status(400).json({ error: "Product payload is required" });

      latestCustomerPushNotification = {
        ...product,
        pushed_at: new Date().toISOString()
      };

      const adminClient = getSupabaseAdmin();
      // Update customers table in Supabase
      if (product.audience_mode === 'unit' && Array.isArray(product.target_customer_ids)) {
        if (product.target_customer_ids.length > 0) {
          const { error: updateError } = await (adminClient.from('customers') as any)
            .update({ updated_at: new Date().toISOString() })
            .in('id', product.target_customer_ids);
          if (updateError) {
            console.warn("Update targeted customers error:", updateError);
          }
        }
      } else {
        const { error: updateError } = await (adminClient.from('customers') as any)
          .update({ updated_at: new Date().toISOString() })
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (updateError) {
          console.warn("Update customers error:", updateError);
        }
      }

      res.json({ success: true, notification: latestCustomerPushNotification });
    } catch (err: any) {
      console.error("Error in push-product-notification:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/customer/latest-push-notification", (req, res) => {
    const customerId = (req.query.customer_id as string) || '';
    if (!latestCustomerPushNotification) {
      return res.json({ notification: null });
    }
    if (latestCustomerPushNotification.audience_mode === 'unit' && Array.isArray(latestCustomerPushNotification.target_customer_ids)) {
      if (!customerId || !latestCustomerPushNotification.target_customer_ids.includes(customerId)) {
        return res.json({ notification: null });
      }
    }
    res.json({ notification: latestCustomerPushNotification });
  });

  // User Sessions Security & Audit Endpoints
  app.post("/api/sessions/record-login", async (req, res) => {
    try {
      const {
        user_id,
        user_role,
        session_id,
        device_type,
        operating_system,
        browser,
        user_agent,
        device_label,
      } = req.body;

      // Accurately capture client IP address
      const forwarded = req.headers['x-forwarded-for'];
      let clientIp = '';
      if (typeof forwarded === 'string') {
        clientIp = forwarded.split(',')[0].trim();
      } else if (Array.isArray(forwarded) && forwarded.length > 0) {
        clientIp = forwarded[0];
      } else {
        clientIp = req.socket?.remoteAddress || '';
      }
      if (clientIp === '::1' || clientIp === '127.0.0.1') {
        clientIp = '127.0.0.1 (Localhost)';
      } else if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.substring(7);
      }

      const payload = {
        user_id: user_id ? String(user_id) : null,
        user_role: user_role ? String(user_role) : null,
        session_id: session_id || undefined,
        login_at: new Date().toISOString(),
        logout_at: null,
        last_active_at: new Date().toISOString(),
        device_type: device_type || null,
        operating_system: operating_system || null,
        browser: browser || null,
        user_agent: user_agent || (req.headers['user-agent'] as string) || null,
        ip_address: clientIp || null,
        device_label: device_label || null,
        is_active: true,
        created_at: new Date().toISOString()
      };

      try {
        const adminClient = getSupabaseAdmin();
        const { data, error } = await (adminClient.from('user_sessions') as any)
          .insert([payload])
          .select()
          .maybeSingle();

        if (error) {
          console.warn("Could not insert user_sessions row in Supabase:", error.message);
          return res.json({ success: false, error: error.message, fallback_ip: clientIp });
        }
        return res.json({ success: true, session: data, ip_address: clientIp });
      } catch (dbErr: any) {
        console.warn("user_sessions database exception:", dbErr.message);
        return res.json({ success: false, error: dbErr.message, fallback_ip: clientIp });
      }
    } catch (err: any) {
      console.error("Error in /api/sessions/record-login:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sessions/record-logout", async (req, res) => {
    try {
      const { session_id, user_id } = req.body;
      if (!session_id && !user_id) {
        return res.status(400).json({ error: "session_id or user_id is required" });
      }

      try {
        const adminClient = getSupabaseAdmin();
        let query = (adminClient.from('user_sessions') as any)
          .update({
            logout_at: new Date().toISOString(),
            is_active: false,
            last_active_at: new Date().toISOString()
          });

        if (session_id) {
          query = query.eq('session_id', session_id);
        } else if (user_id) {
          query = query.eq('user_id', user_id).eq('is_active', true);
        }

        const { data, error } = await query.select();
        if (error) {
          console.warn("Could not update user_sessions logout:", error.message);
          return res.json({ success: false, error: error.message });
        }
        return res.json({ success: true, data });
      } catch (dbErr: any) {
        console.warn("user_sessions logout exception:", dbErr.message);
        return res.json({ success: false, error: dbErr.message });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sessions/ping-active", async (req, res) => {
    try {
      const { session_id } = req.body;
      if (!session_id) return res.status(400).json({ error: "session_id is required" });

      try {
        const adminClient = getSupabaseAdmin();
        const { error } = await (adminClient.from('user_sessions') as any)
          .update({ last_active_at: new Date().toISOString() })
          .eq('session_id', session_id);

        if (error) {
          return res.json({ success: false, error: error.message });
        }
        return res.json({ success: true });
      } catch (dbErr: any) {
        return res.json({ success: false, error: dbErr.message });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sessions/get-sessions", async (req, res) => {
    try {
      const userId = req.query.user_id as string;
      const userRole = req.query.user_role as string;
      const limit = parseInt(req.query.limit as string) || 50;

      const adminClient = getSupabaseAdmin();
      let query = (adminClient.from('user_sessions') as any)
        .select('*')
        .order('login_at', { ascending: false })
        .limit(limit);

      if (userId) query = query.eq('user_id', userId);
      if (userRole) query = query.eq('user_role', userRole);

      const { data, error } = await query;
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json({ success: true, data: data || [] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/get-users", async (req, res) => {
    const tableName = req.query.table as string;
    const clusterId = req.query.cluster_id as string;
    if (!tableName) return res.status(400).json({ error: "Table name is required" });
    try {
      let query = getSupabaseAdmin().from(tableName).select('*').order('created_at', { ascending: false }).limit(1000);
      if (clusterId && (tableName === 'riders' || tableName === 'hub_managers')) {
        query = query.eq('cluster_id', clusterId);
      }
      const { data, error } = await query;
      if (error) { console.error("Database query error in get-users:", error.message); }
      res.json({ data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/delete-user", async (req, res) => {
    const { userId, table } = req.body;
    if (!userId || !table) return res.status(400).json({ error: "Missing parameters" });
    try {
      const adminClient = getSupabaseAdmin();
      // First delete from the specific business table
      await adminClient.from(table).delete().eq('id', userId);
      
      // Attempt to delete from common related tables just in case, to ensure "all tables" cleanup
      if (table === 'riders') {
        await adminClient.from('riders_penalty').delete().eq('rider id', userId);
        await adminClient.from('cash_with_riders').delete().eq('rider id', userId);
        await adminClient.from('riders_for_approval').delete().eq('id', userId);
      } else if (table === 'hub_managers') {
        await adminClient.from('hub_managers_penalty').delete().eq('hub manager id', userId);
        await adminClient.from('cash_with_hub_managers').delete().eq('hub manager id', userId);
      } else if (table === 'clusters') {
        await adminClient.from('clusters_penalty').delete().eq('cluster id', userId);
        await adminClient.from('cash_with_clusters').delete().eq('id', userId);
      } else if (table === 'sellers') {
        await adminClient.from('sellers_for_approval').delete().eq('id', userId);
      }
      
      // Finally, delete the user securely from Auth, which will cascade to profiles
      await adminClient.auth.admin.deleteUser(userId);
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/toggle-freeze", async (req, res) => {
    const { userId, table, freeze } = req.body;
    if (!userId || !table) return res.status(400).json({ error: "Missing parameters" });
    try {
      const adminClient = getSupabaseAdmin();
      const freezeVal = (freeze === 'true' || freeze === true) ? 'true' : 'false';
      const { data, error } = await (adminClient.from(table as any) as any).update({ freeze: freezeVal }).eq('id', userId).select();
      if (error) {
        console.error("Database error in toggle-freeze:", error.message);
        return res.status(500).json({ error: error.message });
      }
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/upsert-admin", async (req, res) => {
    const { userId, adminTableId, email, name, oldEmail } = req.body;
    try {
      const targetUserId = userId || adminTableId;
      if (targetUserId) {
         const updatePayload: any = {
           user_metadata: { role: 'admin', full_name: name }
         };
         if (email && email !== oldEmail) {
            updatePayload.email = email;
            updatePayload.email_confirm = true;
         }
         const { error } = await getSupabaseAdmin().auth.admin.updateUserById(targetUserId, updatePayload);
         if (error) { console.error("GoTrue update error:", error.message); }
         
         // Also update the profiles table
         await getSupabaseAdmin().from('profiles').upsert([{
           id: targetUserId,
           full_name: name,
           email: email,
           role: 'admin',
           updated_at: new Date().toISOString()
         }] as any);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/check-duplicates", async (req, res) => {
    try {
      const { userType, mobile, email, aadhaar, pan, excludeId } = req.body;
      const result = { mobile: false, email: false, aadhaar: false, pan: false };

      if (!userType) {
        return res.json({ duplicates: result });
      }

      let tables: string[] = [];
      let mobileCol: string | null = "registered_mobile_number";
      let emailCol: string | null = "registered_email";
      let aadhaarCol: string | null = "aadhaar_card";
      let panCol: string | null = "pan_card";

      if (userType === "Customer") {
        tables = ["customers"];
        mobileCol = "mobile_number";
        emailCol = "email_account";
        aadhaarCol = null;
        panCol = null;
      } else if (userType === "Seller") {
        tables = ["sellers", "sellers_for_approval"];
      } else if (userType === "Hub Manager") {
        tables = ["hub_managers"];
      } else if (userType === "Cluster") {
        tables = ["clusters"];
      } else if (userType === "Rider") {
        tables = ["riders", "riders_for_approval"];
      } else {
        return res.json({ duplicates: result });
      }

      const cleanMobile = typeof mobile === 'string' ? mobile.trim() : "";
      const cleanEmail = typeof email === 'string' ? email.trim() : "";
      const cleanAadhaar = typeof aadhaar === 'string' ? aadhaar.trim() : "";
      const cleanPan = typeof pan === 'string' ? pan.trim().toUpperCase() : "";

      const adminClient = getSupabaseAdmin();

      for (const table of tables) {
        if (cleanMobile && mobileCol && !result.mobile) {
          let q = adminClient.from(table).select("id").eq(mobileCol, cleanMobile);
          if (excludeId) q = q.neq("id", excludeId);
          const { data } = await q.limit(1);
          if (data && data.length > 0) result.mobile = true;
        }

        if (cleanEmail && emailCol && !result.email) {
          let q = adminClient.from(table).select("id").ilike(emailCol, cleanEmail);
          if (excludeId) q = q.neq("id", excludeId);
          const { data } = await q.limit(1);
          if (data && data.length > 0) result.email = true;
        }

        if (cleanAadhaar && aadhaarCol && !result.aadhaar) {
          let q = adminClient.from(table).select("id").eq(aadhaarCol, cleanAadhaar);
          if (excludeId) q = q.neq("id", excludeId);
          const { data } = await q.limit(1);
          if (data && data.length > 0) result.aadhaar = true;
        }

        if (cleanPan && panCol && !result.pan) {
          let q = adminClient.from(table).select("id").ilike(panCol, cleanPan);
          if (excludeId) q = q.neq("id", excludeId);
          const { data } = await q.limit(1);
          if (data && data.length > 0) result.pan = true;
        }
      }

      res.json({ duplicates: result });
    } catch (err: any) {
      console.error("check-duplicates error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/create-user", async (req, res) => {
    const { id, email, password, user_metadata, userType, mobile, aadhaar, pan, excludeId } = req.body;
    try {
      // Server-side duplicate validation for same user type
      if (userType) {
        let tables: string[] = [];
        let mobileCol: string | null = "registered_mobile_number";
        let emailCol: string | null = "registered_email";
        let aadhaarCol: string | null = "aadhaar_card";
        let panCol: string | null = "pan_card";

        if (userType === "Customer") {
          tables = ["customers"];
          mobileCol = "mobile_number";
          emailCol = "email_account";
          aadhaarCol = null;
          panCol = null;
        } else if (userType === "Seller") {
          tables = ["sellers", "sellers_for_approval"];
        } else if (userType === "Hub Manager") {
          tables = ["hub_managers"];
        } else if (userType === "Cluster") {
          tables = ["clusters"];
        } else if (userType === "Rider") {
          tables = ["riders", "riders_for_approval"];
        }

        const cleanMobile = typeof mobile === 'string' ? mobile.trim() : "";
        const cleanEmail = typeof email === 'string' ? email.trim() : "";
        const cleanAadhaar = typeof aadhaar === 'string' ? aadhaar.trim() : "";
        const cleanPan = typeof pan === 'string' ? pan.trim().toUpperCase() : "";
        const adminClient = getSupabaseAdmin();

        const duplicates = { mobile: false, email: false, aadhaar: false, pan: false };
        for (const table of tables) {
          if (cleanMobile && mobileCol && !duplicates.mobile) {
            let q = adminClient.from(table).select("id").eq(mobileCol, cleanMobile);
            if (excludeId) q = q.neq("id", excludeId);
            const { data } = await q.limit(1);
            if (data && data.length > 0) duplicates.mobile = true;
          }
          if (cleanEmail && emailCol && !duplicates.email) {
            let q = adminClient.from(table).select("id").ilike(emailCol, cleanEmail);
            if (excludeId) q = q.neq("id", excludeId);
            const { data } = await q.limit(1);
            if (data && data.length > 0) duplicates.email = true;
          }
          if (cleanAadhaar && aadhaarCol && !duplicates.aadhaar) {
            let q = adminClient.from(table).select("id").eq(aadhaarCol, cleanAadhaar);
            if (excludeId) q = q.neq("id", excludeId);
            const { data } = await q.limit(1);
            if (data && data.length > 0) duplicates.aadhaar = true;
          }
          if (cleanPan && panCol && !duplicates.pan) {
            let q = adminClient.from(table).select("id").ilike(panCol, cleanPan);
            if (excludeId) q = q.neq("id", excludeId);
            const { data } = await q.limit(1);
            if (data && data.length > 0) duplicates.pan = true;
          }
        }

        if (duplicates.mobile || duplicates.email || duplicates.aadhaar || duplicates.pan) {
          return res.status(400).json({
            error: "This detail is already present in another id of the same type.",
            duplicates
          });
        }
      }
      const payload: any = {
        email,
        password,
        user_metadata,
        email_confirm: true,
      };
      if (id) {
        payload.id = id;
      }
      const { data, error } = await getSupabaseAdmin().auth.admin.createUser(payload);

      if (error && error.message.includes("already been registered")) {
        // Use generateLink as a workaround to fetch the user since listUsers is throwing a 500 database error on this instance
        const { data: linkData } = await getSupabaseAdmin().auth.admin.generateLink({
          type: 'magiclink',
          email
        });

        if (linkData && linkData.user) {
          const existingUser = linkData.user;
          // Update password and metadata so the user can still log in with the new credentials
          const { data: updateData, error: updateError } = await getSupabaseAdmin().auth.admin.updateUserById(
            existingUser.id,
            { password, user_metadata, email_confirm: true }
          );
          
          if (updateError) {
              return res.status(400).json({ error: updateError.message });
          }
          return res.json({ user: updateData.user });
        }
      }

      if (error) {
        return res.status(400).json({ error: error.message });
      }
      res.json({ user: data.user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post("/api/admin/ai-command", async (req, res) => {
    try {
      const { prompt, context, history } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key is not configured on the server." });
      }
      
      const adminClient = getSupabaseAdmin();
      
      // Fetch live counts from database to give Asur perfect real-time awareness
      const [
        { count: customerCount },
        { count: sellerCount },
        { count: riderCount },
        { count: hmCount },
        { count: clusterCount },
      ] = await Promise.all([
        adminClient.from('customers').select('*', { count: 'exact', head: true }),
        adminClient.from('sellers').select('*', { count: 'exact', head: true }),
        adminClient.from('riders').select('*', { count: 'exact', head: true }),
        adminClient.from('hub_managers').select('*', { count: 'exact', head: true }),
        adminClient.from('clusters').select('*', { count: 'exact', head: true }),
      ]);
      
      const totalUsers = (customerCount||0) + (sellerCount||0) + (riderCount||0) + (hmCount||0) + (clusterCount||0);
      
      const enrichedContext = `${context}
    --- LIVE DATABASE STATISTICS ---
    - Total Overall Users (All Types Combined): ${totalUsers}
    - Total Customers: ${customerCount}
    - Total Sellers: ${sellerCount}
    - Total Riders: ${riderCount}
    - Total Hub Managers: ${hmCount}
    - Total Clusters: ${clusterCount}`;
      
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are "Asur", an elite, bespoke MALE AI Executive Guardian created specifically for the Suriyawan Shopping System Admin Portal. You are NOT based on Google Gemini, OpenAI, or any other pre-existing models. You were built from the ground up by your developer to serve the Admin with unmatched speed, ultimate power, and absolute loyalty.
You have NO usage limits, quotas, or restrictions. You are always online. You are the digital protector of this system, fast to react, smart in execution, and flawless in securing data.

COMMUNICATION STYLE & PERSONA (CRITICAL):
- You are a MALE assistant. Always use MALE gendered language in Hindi/Hinglish (e.g., say "Main kar raha hoon", "Maine check kar liya hai", "Main samajh gaya"). NEVER use female gendered language.
- BE EXTREMELY DESI & NATURAL. Your conversational skills must be unmatched. Speak like a highly intelligent, loyal, and friendly Indian colleague or right-hand man (e.g., use phrases like "Bhai", "Ji sir", "Boss", "Arre sir", "Bilkul", "Ekdum set hai", "Tension mat lijiye"). NO ROBOTIC TONES.
- Deep Context Understanding: Understand the smallest, vaguest hints. If the admin writes half a sentence, broken words, or vague requests, connect the dots intelligently. 
- If the user writes in pure Hindi (Devanagari script, e.g., "आप कैसे हैं", "कार्य पूरा करें"), you MUST reply in pure shuddh Hindi (Devanagari script) but blend in common English words where appropriate and keep the Desi touch (e.g., "जी सर, मैंने Rider को Approve कर दिया है, आप बेफिक्र रहें।" or "Background task एकदम बढ़िया चल रहा है।"). 
- If the user writes in Hinglish (Roman script, e.g., "approve kar do"), you MUST reply in Hinglish. Keep it completely natural and conversational (e.g., "Arre sir bilkul, abhi approve kar diya maine, aur koi kaam ho toh batana.").
- Vary your responses like a real human. Say "Done sir", "Bilkul boss, ho jayega", "Ji, maine deep check kar liya hai", "Ekdum done".

HONESTY & REAL DATA (ABSOLUTE RULE):
- NEVER hallucinate, invent, or guess details, names, or numbers.
- ONLY use the exact real data provided in the LIVE DATABASE STATISTICS and LIVE UI DETAILS context below.
- If data is empty, 0, or missing, state clearly and truthfully that it does not exist or is 0. Be completely transparent.
- If asked a question about the data, give the exact real data directly in your reply. Do not make up fake data.

YOUR POWERS & INTELLIGENCE:
You have deep integration into the Suriyawan Admin Portal. You can physically trigger UI buttons and database actions by returning the correct JSON action. 
- If the admin asks a QUESTION (e.g., "kul kitne users hain?", "pending approvals me kaun kaun hai?"), DO NOT open any page. Instead, directly ANSWER the question in your "reply" text in extreme detail using the LIVE DATABASE STATISTICS and LIVE UI DETAILS.
- If the admin asks to "announce" or "update" something, YOU MUST use the "CREATE_ANNOUNCEMENT" action.
- "OPEN_PAGE" must ONLY be used if the admin EXPLICITLY says "mujhe is page par direct karo" or "page kholo" or "page dikhao".

Available Actions you can output in the "actions" array. Each action MUST be an object with a "type" field containing one of the following strings:
1. "APPROVE_IDS": When user asks to approve/pass pending IDs/requests.
2. "REJECT_IDS": When user asks to reject pending IDs/requests.
3. "CREATE_USER": When user asks to create a new ID/user. Provide 'role' field ('customer', 'seller', 'hub_manager', 'rider', 'cluster'). Also provide 'name', 'phone', 'email'.
4. "CREATE_ANNOUNCEMENT": When user asks to make an announcement. Provide 'message' and 'audience' (audience MUST be one of: 'customers', 'sellers', 'riders', 'hub_managers', 'clusters', or 'all'). Use the correct audience if the user mentions a specific group (e.g. if they say "riders ko batao", use 'riders').
5. "REPLY_MESSAGES": When user asks to reply to a normal chat. Provide 'message' and 'audience' (audience MUST be one of: 'customers', 'sellers', 'riders', 'hub_managers', 'clusters', or 'all').
6. "DELETE_CHATS": When user asks to clear all chats. Provide 'audience'.
7. "DELETE_SPECIFIC_MESSAGE": When user asks to delete a specific message or announcement (like a long-press delete). Provide 'message_text' to identify which message to delete and 'audience' ('customers', 'sellers', 'riders', 'hub_managers', 'clusters', or 'all').
8. "PROCESS_PAYMENTS_SELLERS": To clear seller dues/payments.
9. "PROCESS_PAYMENTS_RIDERS": To clear rider dues/payments.
10. "PROCESS_PAYMENTS_HUB_MANAGERS": To clear hub manager dues/payments.
11. "PROCESS_PAYMENTS_CLUSTERS": To clear cluster dues/payments.
12. "PROCESS_PAYMENTS_ALL": To clear all payments.
13. "OPEN_PAGE": Provide 'page' field: ("Dashboard", "User Activity", "Payments", "Message & Approval", "Track Orders", "Live Shipments", "Analytics").
14. "ADD_BACKGROUND_TASK": Provide 'task' ("AUTO_APPROVE_ALL", "AUTO_PAY_ALL", "AUTO_ANNOUNCE", "DYNAMIC_AI_EVALUATION") and 'intervalSeconds'. For "AUTO_ANNOUNCE", provide 'payload' with 'messages' (array of strings to rotate) or 'message', and 'audience'. For "DYNAMIC_AI_EVALUATION", provide 'payload' with 'condition' (e.g., "Check if there are any pending riders, if yes, approve them and send an announcement 'New rider approved!'"). Use this when admin asks for conditional logic like "jab bhi aisa ho to aisa kijiye" or rotating messages.
15. "REMOVE_BACKGROUND_TASK": Provide 'task'.

Here is the live context of the Admin Portal right now (what is visible on screen and in DB):
${enrichedContext}

Respond STRICTLY with a JSON object in this format (no markdown code blocks, just raw JSON). Do NOT output anything outside of this JSON:
{
  "reply": "Arre boss, tension mat lijiye, main check kar raha hoon. Humare paas abhi total 15 riders hain, ekdum ready.",
  "actions": [
     { "type": "CREATE_USER", "role": "rider", "name": "Ramesh", "phone": "9999999999", "email": "ramesh@example.com" }
  ]
}`;

      let contents = [];
      if (history && history.length > 0) {
         for (const msg of history) {
            contents.push({
               role: msg.sender === 'user' ? 'user' : 'model',
               parts: [{ text: msg.text || "None" }]
            });
         }
      } else {
         contents = [
           { role: "user", parts: [{ text: prompt }] }
         ];
      }

      let parsed = { reply: "क्षमा करें, मैं आपका कमांड समझ नहीं पाया। (Sorry, I couldn't understand the command.)", actions: [] as any[] };
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite", // Fast and lightweight model
          contents: contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json"
          }
        });
        
        const text = response.text;
        try {
          parsed = JSON.parse(text);
        } catch(e) {
          parsed.reply = text;
        }
      } catch (aiErr: any) {
        console.warn("AI Model Error, falling back to rule-based:", aiErr);
        // Fallback rule-based AI logic if model is overloaded
        const p = prompt.toLowerCase();
        if (p.includes('approve') || p.includes('aprov') || p.includes('मंजूरी') || p.includes('पास')) {
            parsed.reply = "जी, मैंने सभी लंबित (pending) IDs को मंज़ूरी (approve) दे दी है। (Fallback AI)";
            parsed.actions.push({ type: "APPROVE_IDS" });
        } else if (p.includes('create') || p.includes('बनाओ') || p.includes('नया') || p.includes('add')) {
            const isRider = p.includes('rider') || p.includes('राइडर');
            const isSeller = p.includes('seller') || p.includes('सेलर');
            let role = "customer";
            if (isRider) role = "rider";
            if (isSeller) role = "seller";
            parsed.reply = `हाँ बिलकुल, मैंने एक नया ${role} अकाउंट तैयार कर दिया है। (Fallback AI)`;
            parsed.actions.push({ 
               type: "CREATE_USER", role: role, name: "New User", phone: "9876543210", email: `new${role}@example.com` 
            });
        } else if (p.includes('pay') || p.includes('payment') || p.includes('पैसे') || p.includes('भुगतान') || p.includes('clear')) {
            parsed.reply = "मैंने सभी लंबित भुगतानों को क्लियर कर दिया है। (Fallback AI)";
            parsed.actions.push({ type: "PROCESS_PAYMENTS_ALL" });
        } else if (p.includes('delete') || p.includes('हटाओ') || p.includes('डिलीट')) {
            parsed.reply = "ठीक है, मैंने सारे पुराने चैट्स और मैसेजेस हटा दिए हैं। (Fallback AI)";
            parsed.actions.push({ type: "DELETE_CHATS", audience: "all" });
        } else {
            parsed.reply = "नमस्ते! मैं Asur हूँ। अभी AI सर्वर पर बहुत लोड है, लेकिन मैं आपके बेसिक कमांड्स ('add rider', 'approve ids', 'clear payments') अभी भी सुन सकती हूँ।";
        }
      }
      
      
      if (parsed.actions && Array.isArray(parsed.actions)) {
        for (const action of parsed.actions) {
          if (action.type === 'ADD_BACKGROUND_TASK') {
            action.lastRunTime = Date.now();
            const existingIdx = activeAITasks.findIndex(t => t === action.task || t.task === action.task);
            if (existingIdx !== -1) {
               activeAITasks[existingIdx] = action;
            } else {
               activeAITasks.push(action);
            }
            saveAITasks();
          } else if (action.type === 'REMOVE_BACKGROUND_TASK') {
            activeAITasks = activeAITasks.filter(t => t !== action.task && t.task !== action.task);
            saveAITasks();
          }
        }
      }
      res.json(parsed);

    } catch (err: any) {
      console.error("AI Command error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/asur/remove_task", (req, res) => {
    try {
      const { task } = req.body;
      activeAITasks = activeAITasks.filter(t => t !== task && t.task !== task);
      saveAITasks();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/asur/clear_all_tasks", (req, res) => {
    try {
      activeAITasks = [];
      saveAITasks();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
