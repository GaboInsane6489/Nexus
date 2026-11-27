import { createHmac } from 'node:crypto';

export interface N8nWebhookResult {
  sent: boolean;
  reason?: string;
}

/**
 * Triggers an outbound n8n webhook without throwing on network or config failures
 * so Server Actions are never blocked by automation transport issues.
 */
export async function triggerN8nWebhook(
  event: string,
  payload: Record<string, unknown>
): Promise<N8nWebhookResult> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return { sent: false, reason: 'N8N_NOT_CONFIGURED' };
  }

  const body = JSON.stringify({
    event,
    payload,
    timestamp: new Date().toISOString(),
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const secret = process.env.N8N_WEBHOOK_SECRET?.trim();
  if (secret) {
    const signature = createHmac('sha256', secret).update(body).digest('hex');
    headers['x-nexus-signature'] = signature;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      return { sent: false, reason: `HTTP_${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'NETWORK_ERROR';
    return { sent: false, reason };
  }
}
