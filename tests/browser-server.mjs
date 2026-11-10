import { preview } from 'vite';

export default async function startPreview() {
  const server = await preview({ preview: { host: '127.0.0.1', port: 4178, strictPort: true } });
  return () => server.close();
}

