import Pusher from 'pusher';

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "1234567",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "fake-key",
  secret: process.env.PUSHER_SECRET || "fake-secret",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
  useTLS: true
});
