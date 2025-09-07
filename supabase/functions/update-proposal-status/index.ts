// This Edge Function has been replaced by the RPC function update_proposal_status_by_token
// The RPC function is more efficient and secure for this use case
// This file can be safely deleted

export default function() {
  return new Response(
    JSON.stringify({ 
      error: 'This function has been deprecated. Use RPC function update_proposal_status_by_token instead.' 
    }),
    { 
      status: 410,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}