export default async function handler(req: any, res: any) {
  const { session_id } = req.query;

  // Set Cache-Control to prevent browsers or CDNs from caching the redirect incorrectly
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (!session_id) {
    return res.redirect(302, '/#/');
  }

  const encodedId = encodeURIComponent(session_id);
  const targetUrl = `/#/success?session_id=${encodedId}`;

  return res.redirect(302, targetUrl);
}