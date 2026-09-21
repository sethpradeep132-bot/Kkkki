const fs = require('fs');
let code = fs.readFileSync('src/components/portals/UploadProductForm.tsx', 'utf-8');

const targetStr = `        if (data && !error) {
          const fetchedCharges = [
            { id: '1', name: 'Referral Fee', value: data['Referral Fee'] || '0', isPercentage: true },
            { id: '2', name: 'Closing Fee', value: data['Closing Fee'] || '0', isPercentage: false },
            { id: '3', name: 'COD Fee', value: data['COD Fee'] || '0', isPercentage: false },
            { id: '4', name: 'Shipping Fee', value: data['Shipping Fee'] || '0', isPercentage: false },
            { id: '5', name: 'C-GST', value: data['C-GST'] || '0', isPercentage: true },
            { id: '6', name: 'S-GST', value: data['S-GST'] || '0', isPercentage: true },
            { id: '7', name: 'TDS charge', value: data['TDS charge'] || '0', isPercentage: true },
            { id: '8', name: 'TCS charge', value: data['TCS charge'] || '0', isPercentage: true },
          ];
          
          if (data.other_charges) {
            let otherChargesArray = [];
            if (Array.isArray(data.other_charges)) {
               otherChargesArray = data.other_charges;
            } else if (typeof data.other_charges === 'object') {
               otherChargesArray = Object.values(data.other_charges);
            }
            if (otherChargesArray.length > 0) {
               otherChargesArray.forEach((ch: any, idx: number) => {
                  fetchedCharges.push({
                     id: \`other_\${idx}\`,
                     name: ch.name || 'Other',
                     value: String(ch.value || 0),
                     isPercentage: ch.isPercentage === true || String(ch.isPercentage) === 'true'
                  });
               });
            }
          }
          setAdminCharges(fetchedCharges);
        } else {`;

const replacementStr = `        if (data && !error) {
          const parseValue = (val: string | null | undefined) => {
            if (!val) return { value: '0', isPercentage: false };
            const str = String(val);
            if (str.endsWith('%')) return { value: str.slice(0, -1), isPercentage: true };
            return { value: str, isPercentage: false };
          };

          const fetchedCharges = [
            { id: '1', name: 'Referral Fee', ...parseValue(data['Referral Fee']) },
            { id: '2', name: 'Closing Fee', ...parseValue(data['Closing Fee']) },
            { id: '3', name: 'COD Fee', ...parseValue(data['COD Fee']) },
            { id: '4', name: 'Shipping Fee', ...parseValue(data['Shipping Fee']) },
            { id: '5', name: 'C-GST', ...parseValue(data['C-GST']) },
            { id: '6', name: 'S-GST', ...parseValue(data['S-GST']) },
            { id: '7', name: 'TDS charge', ...parseValue(data['TDS charge']) },
            { id: '8', name: 'TCS charge', ...parseValue(data['TCS charge']) },
          ];
          
          if (data.other_charges && typeof data.other_charges === 'object') {
            Object.keys(data.other_charges).forEach((key, idx) => {
               fetchedCharges.push({
                  id: \`other_\${idx}\`,
                  name: key,
                  ...parseValue(data.other_charges[key])
               });
            });
          }
          setAdminCharges(fetchedCharges);
        } else {`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/portals/UploadProductForm.tsx', code);
  console.log('Replaced correctly');
} else {
  console.log('Target string not found');
}
