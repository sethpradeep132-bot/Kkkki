import { supabase } from '../lib/supabase';

export const buildShipmentStatus = async (
  shortMessage: string,
  existingShipmentData: any,
  newUpdates: any
) => {
  const mergedData = { ...existingShipmentData, ...newUpdates };
  
  let riderName = '';
  let riderId = mergedData['Rider id'] || '';
  if (mergedData['Rider id']) {
     const { data } = await supabase.from('riders').select('rider_name').eq('id', mergedData['Rider id']).maybeSingle();
     if (data && data.rider_name) riderName = data.rider_name;
  }
  
  let hubManagerName = '';
  let hubManagerId = mergedData['hub manager id'] || '';
  if (mergedData['hub manager id']) {
     const { data } = await supabase.from('hub_managers').select('hub_name, hub_manager_name').eq('id', mergedData['hub manager id']).maybeSingle();
     if (data) hubManagerName = data.hub_manager_name || data.hub_name || '';
  }
  
  // Create an exact date and time representation for this specific update
  const exactDateTime = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
  });
  
  let formattedBlock = `[Update Date & Time: ${exactDateTime}]\n`;
  if (shortMessage) {
    formattedBlock += `Update Action: ${shortMessage}\n`;
  }
  
  const addField = (label: string, value: any) => {
    if (value !== undefined && value !== null && value !== '') {
      formattedBlock += `${label}: ${value}\n`;
    }
  };

  const prevStatus = existingShipmentData['shipment status'] || '';
  
  if (!prevStatus) {
      addField('full name', mergedData['full name']);
      addField('mobile number', mergedData['mobile number']);
      addField('full address', mergedData['full address']);
      addField('pincode', mergedData['pincode']);
      addField('landmark', mergedData['landmark']);
      addField('address type', mergedData['address type']);
      addField('product image', mergedData['product image']);
      addField('product name', mergedData['product name']);
      addField('product tittle name', mergedData['product tittle name']);
      addField('product discription', mergedData['product discription']);
      
      let keyFeaturesVal = mergedData['key features'];
      if (typeof keyFeaturesVal === 'object' && keyFeaturesVal !== null) {
          try {
              keyFeaturesVal = JSON.stringify(keyFeaturesVal);
          } catch(e) {}
      }
      addField('key features', keyFeaturesVal);
      
      addField('size', mergedData['size']);
      addField('colour', mergedData['colour']);
      addField('weight', mergedData['weight']);
      addField('total amount', mergedData['total amount']);
      addField('total quantity', mergedData['total quantity']);
      addField('payment method', mergedData['payment method']);
  }
  
  addField('order ID', mergedData['order ID']);
  addField('pickup ID', mergedData['pickup ID']);
  addField('awb number', mergedData['awb number']);
  addField('tracking id number', mergedData['tracking id number']);
  addField('shipment type', mergedData['shipment type']);
  addField('shipment tag', mergedData['shipment tag']);
  addField('runsheet id', mergedData['runsheet id']);
  addField('pickupsheet id', mergedData['pickupsheet id']);
  addField('attempt', mergedData['attempt']);
  addField('call details', mergedData['call details']);
  addField('bag id', mergedData['bag id']);
  addField('seal tag', mergedData['seal tag']);
  addField('vehicle number', mergedData['vehicle number']);
  addField('digital signature', mergedData['digital signature']);
  addField('captured images', mergedData['captured images']);
  addField('payment type', mergedData['payment type']);
  addField('assignment hub name', mergedData['assignment hub name']);
  addField('days', mergedData['days']);
  
  if (riderId) addField('Rider id', riderId);
  if (riderName) addField('Rider name', riderName);
  if (hubManagerId) addField('hub manager id', hubManagerId);
  if (hubManagerName) addField('hub manager name', hubManagerName);
  
  if (prevStatus) {
    // Append the new update at the bottom, keeping all previous history intact
    return prevStatus + '\n\n-----------------------------------\n\n' + formattedBlock.trim();
  }
  return formattedBlock.trim();
};
