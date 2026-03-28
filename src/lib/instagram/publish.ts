const GRAPH_API_BASE = 'https://graph.instagram.com/v21.0';

interface PublishResult {
  id: string;
  permalink?: string;
  media_url?: string;
}

export async function publishSingleImage(
  accessToken: string,
  igUserId: string,
  imageUrl: string,
  caption: string
): Promise<PublishResult> {
  const containerRes = await fetch(
    `${GRAPH_API_BASE}/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );

  if (!containerRes.ok) {
    const error = await containerRes.json().catch(() => ({}));
    throw new Error(`Container creation failed: ${JSON.stringify(error)}`);
  }

  const container = await containerRes.json();

  await waitForContainer(accessToken, container.id);

  const publishRes = await fetch(
    `${GRAPH_API_BASE}/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: accessToken,
      }),
    }
  );

  if (!publishRes.ok) {
    const error = await publishRes.json().catch(() => ({}));
    throw new Error(`Publishing failed: ${JSON.stringify(error)}`);
  }

  const published = await publishRes.json();

  const mediaRes = await fetch(
    `${GRAPH_API_BASE}/${published.id}?fields=permalink,media_url&access_token=${accessToken}`
  );
  const mediaData = await mediaRes.json();

  return {
    id: published.id,
    permalink: mediaData.permalink,
    media_url: mediaData.media_url,
  };
}

export async function publishCarousel(
  accessToken: string,
  igUserId: string,
  imageUrls: string[],
  caption: string
): Promise<PublishResult> {
  const childIds: string[] = [];

  for (const url of imageUrls) {
    const res = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: url,
        is_carousel_item: true,
        access_token: accessToken,
      }),
    });
    if (!res.ok) throw new Error('Carousel child creation failed');
    const child = await res.json();
    childIds.push(child.id);
  }

  for (const id of childIds) {
    await waitForContainer(accessToken, id);
  }

  const containerRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: childIds,
      caption,
      access_token: accessToken,
    }),
  });

  if (!containerRes.ok) throw new Error('Carousel container creation failed');
  const container = await containerRes.json();

  await waitForContainer(accessToken, container.id);

  const publishRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
  });

  if (!publishRes.ok) throw new Error('Carousel publish failed');
  const published = await publishRes.json();

  return { id: published.id };
}

export async function publishReel(
  accessToken: string,
  igUserId: string,
  videoUrl: string,
  caption: string
): Promise<PublishResult> {
  const containerRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: accessToken,
    }),
  });

  if (!containerRes.ok) throw new Error('Reel container creation failed');
  const container = await containerRes.json();

  await waitForContainer(accessToken, container.id, 60000);

  const publishRes = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
  });

  if (!publishRes.ok) throw new Error('Reel publish failed');
  const published = await publishRes.json();

  return { id: published.id };
}

async function waitForContainer(
  accessToken: string,
  containerId: string,
  maxWaitMs = 30000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(
      `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await res.json();

    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') {
      throw new Error(`Container processing failed: ${JSON.stringify(data)}`);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error('Container processing timed out');
}
