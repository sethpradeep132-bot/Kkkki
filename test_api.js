import fetch from 'node-fetch';

async function run() {
  const clusterId = 'b7f5c0b8-e705-4f42-9345-f9add372fb78';
  const url = `http://localhost:3000/api/admin/get-users?table=hub_managers&cluster_id=${clusterId}`;
  try {
     const res = await fetch(url);
     const data = await res.json();
     console.log("Status:", res.status);
     console.log("Data:", data.data?.length);
  } catch (e) {
     console.error(e);
  }
}
run();
