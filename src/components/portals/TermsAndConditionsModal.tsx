import React from 'react';
import { X } from 'lucide-react';

export const TermsAndConditionsModal = ({ 
  isOpen, 
  onClose, 
  userType 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  userType: 'customer' | 'seller' | 'rider' | 'hub' 
}) => {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (userType) {
      case 'customer':
        return (
          <>
            <h1 className="text-2xl font-bold mb-6 uppercase">Customer Terms & Conditions</h1>
            <p className="mb-4">Welcome to Suriyawan Shopping. By using our platform as a customer, you agree to the following terms and conditions.</p>
            
            <h2 className="text-xl font-bold mt-6 mb-2">1. Ordering & Delivery</h2>
            <p className="mb-4">Customers are expected to provide accurate delivery information. We strive to deliver products within the estimated timeframe, but delays may occur due to unforeseen circumstances.</p>
            
            <h2 className="text-xl font-bold mt-6 mb-2">2. Returns & Refunds</h2>
            <div className="mb-4 space-y-2">
              <p>1. Open Box Delivery with a few-Day Return Policy — Subject to Return Eligibility.</p>
              <p>2. Open Box Delivery with No Return Policy — Not Subject to Return Eligibility.</p>
            </div>
            
            <h2 className="text-xl font-bold mt-6 mb-2">3. Cancellation & Account Review Policy</h2>
            <p className="mb-4">
              We understand that sometimes cancellations are unavoidable. If you need to cancel an order, you are free to do so. 
              <strong> However, if orders are cancelled frequently (e.g., more than 3 times), your ID will NOT be immediately blocked. </strong> 
              Instead, our support team will place the account under a routine review process. We will look into the reasons and circumstances of the cancellations to understand if there is a genuine issue. An account will only be subject to suspension if the review confirms malicious intent or intentional platform misuse.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-2">4. User Conduct</h2>
            <p className="mb-4">Any abusive language, threats, or misbehavior with our delivery partners (Riders) or customer support agents will lead to strict action, including permanent account termination.</p>
          </>
        );
      case 'seller':
        return (
          <>
            <h1 className="text-2xl font-bold mb-6 uppercase">Seller Terms & Conditions</h1>
            <p className="mb-4">By registering as a seller on Suriyawan Shopping, you agree to comply with the following policies to ensure a trustworthy marketplace.</p>
            
            <h2 className="text-xl font-bold mt-6 mb-2">1. Product Quality & Listing</h2>
            <p className="mb-4">Sellers must provide accurate descriptions, images, and prices for all products. Listing counterfeit, illegal, or prohibited items is strictly forbidden and will lead to immediate account suspension.</p>
            
            <h2 className="text-xl font-bold mt-6 mb-2">2. Order Dispatch</h2>
            <p className="mb-4">Orders must be packed properly and marked ready for dispatch within the stipulated time. Failure to process orders timely may result in penalties and lower seller ratings.</p>
            
            <h2 className="text-xl font-bold mt-6 mb-2">3. Transport & Logistics Liability</h2>
            <p className="mb-4 font-bold">
              Important: The Company (Suriyawan Shopping) shall not be held liable or responsible for any damage, destruction, or loss of goods that occurs during transit or logistics operations (pick-up, transport, and delivery). Sellers are advised to package their products securely to withstand transit handling. The entire risk of product damage during transportation remains outside the company's liability.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-2">4. Payouts & Penalties</h2>
            <p className="mb-4">Payouts will be processed based on the agreed cycle after successful deliveries. Penalties may be applied for high return rates due to "Wrong Item Sent" or "Defective Products".</p>
          </>
        );
      case 'rider':
        return (
          <>
            <h1 className="text-2xl font-bold mb-6 uppercase">Rider Terms & Conditions</h1>
            <p className="mb-4">As a delivery partner (Rider) for Suriyawan Shopping, you are an essential part of our logistics network. By accepting this role, you agree to the following terms.</p>
            
            <h2 className="text-xl font-bold mt-6 mb-2">1. Delivery Responsibilities</h2>
            <p className="mb-4">Riders must ensure the safe and timely delivery of packages. You are expected to treat all packages with care and behave professionally with customers and sellers at all times.</p>
            
            <h2 className="text-xl font-bold mt-6 mb-2">2. Cash Handling (COD)</h2>
            <p className="mb-4">All cash collected from Cash on Delivery (COD) orders must be accurately tracked and deposited at the designated Hub or via online settlement on the same working day.</p>
            
            <h2 className="text-xl font-bold mt-6 mb-2">3. Fraud, Penalty & Legal Action</h2>
            <p className="mb-4 font-bold">
              Strict action will be taken against any fraudulent activities, intentional mistakes, or misappropriation of goods and cash. Any such fraud or deliberate mistake will result in immediate financial penalties, recovery of losses from the rider, and severe legal action.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-2">4. Quality Checks</h2>
            <p className="mb-4">When picking up returns, riders must conduct a fair and accurate Quality Check (QC) at the customer's doorstep according to platform guidelines.</p>
          </>
        );
      case 'hub':
        return (
          <>
            <h1 className="text-2xl font-bold mb-6 uppercase">Hub Logistics Terms & Conditions</h1>
            <p className="mb-4">Hub Managers are responsible for the smooth operation of the fulfillment and dispatch centers. By operating a hub, you agree to these terms.</p>
            
            <h2 className="text-xl font-bold mt-6 mb-2">1. Shipment Processing</h2>
            <p className="mb-4">Hub Managers must ensure 100% accurate scanning, sorting, and routing of all incoming and outgoing shipments. Misrouting packages causes delays and impacts customer satisfaction.</p>
            
            <h2 className="text-xl font-bold mt-6 mb-2">2. Facility Management</h2>
            <p className="mb-4">The hub facility must be maintained securely to prevent theft, loss, or damage to the packages stored within the premises.</p>
            
            <h2 className="text-xl font-bold mt-6 mb-2">3. Fraud, Penalty & Legal Action</h2>
            <p className="mb-4 font-bold">
              Hub managers are entrusted with high-value goods and critical logistics operations. Any fraudulent activities, intentional misrouting, theft, or deliberate mismanagement of hub operations will lead to strict penalties, full recovery of financial losses, and necessary legal action against the responsible individuals.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-2">4. Reporting</h2>
            <p className="mb-4">All discrepancies, missing packages, or system errors must be reported immediately to the central operations team.</p>
          </>
        );
      default:
        return <p>Terms and conditions not found.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col font-sans text-black">
      {/* Sticky Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300 sticky top-0 bg-white z-10 shadow-sm">
        <h2 className="text-lg font-bold">Terms & Conditions</h2>
        <button 
          onClick={onClose}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto text-base leading-relaxed text-justify">
          {renderContent()}
          
          <div className="mt-12 pt-8 border-t border-gray-300 text-center text-sm text-gray-500">
            <p>End of Document</p>
            <p className="mt-2">© {new Date().getFullYear()} Suriyawan Shopping. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
