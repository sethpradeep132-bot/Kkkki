const fs = require('fs');

function fixAdminPortal() {
    let content = fs.readFileSync('src/components/portals/AdminPortal.tsx', 'utf-8');

    // Fix handleSaveRiderPenalty
    content = content.replace(/const payload: any = \{\s*"admin id": adminProfileId,\s*"cluster id": clusterId,\s*"rider id": riderPenaltyForm\.userId,/g, 
        `const payload: any = {\n      "rider id": riderPenaltyForm.userId,`);

    // Fix handleSaveHmPenalty
    content = content.replace(/const payload: any = \{\s*"admin id": adminProfileId,\s*"cluster id": clusterId,\s*"hub manager id": hmPenaltyForm\.userId,/g, 
        `const payload: any = {\n      "hub manager id": hmPenaltyForm.userId,`);

    // Fix handleSaveClusterPenalty
    content = content.replace(/const payload: any = \{\s*"cluster id": clusterPenaltyForm\.userId,/g, 
        `const payload: any = {\n      "cluster id": clusterPenaltyForm.userId,`); // wait, cluster id IS valid for clusters_penalty?
    
    // Actually let's just use regex to remove "admin id" and "cluster id" from all payloads EXCEPT cluster id in clusters_penalty
    // Let's do it carefully with strings.
    fs.writeFileSync('src/components/portals/AdminPortal.tsx', content);
}

function fixClusterPortal() {
    let content = fs.readFileSync('src/components/portals/ClusterPortal.tsx', 'utf-8');

    // Fix fetchRiderPenalties
    content = content.replace(/await supabase\.from\('riders_penalty'\)\.select\('\*'\)\.eq\('cluster id', clusterUserData\.id\);/g,
        `await supabase.from('riders_penalty').select('*');`);

    // Fix fetchHmPenalties
    content = content.replace(/await supabase\.from\('hub_managers_penalty'\)\.select\('\*'\)\.eq\('cluster id', clusterUserData\.id\);/g,
        `await supabase.from('hub_managers_penalty').select('*');`);

    // Fix payloads
    content = content.replace(/"cluster id": clusterId,\s*"rider id":/g, `"rider id":`);
    content = content.replace(/"cluster id": clusterId,\s*"hub manager id":/g, `"hub manager id":`);
    
    // Let's also check if they filter in UI
    // For Hm:
    content = content.replace(/\{hmPenalties\.filter\(p => !hubManagerPenaltySearch/g, 
        `{hmPenalties.filter(p => penaltyHubManagers.some(r => r.id === p["hub manager id"])).filter(p => !hubManagerPenaltySearch`);
        
    // For Rider:
    content = content.replace(/\{riderPenalties\.filter\(p => !riderPenaltySearch/g, 
        `{riderPenalties.filter(p => penaltyRiders.some(r => r.id === p["rider id"])).filter(p => !riderPenaltySearch`);

    fs.writeFileSync('src/components/portals/ClusterPortal.tsx', content);
}

fixAdminPortal();
fixClusterPortal();
