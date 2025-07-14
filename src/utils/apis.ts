import { supabase } from '../supabase/SupabaseClient';
export async function IsExistTranscript(video_url: string): Promise<any> {
  // call edge function to fetch transcript
  const { data, error } = await supabase.functions.invoke('get-transcript-status', {
    method: 'POST',
    body: JSON.stringify({ "video_url": video_url }),
  });

  if (error) {
    console.error('Error fetching transcript:', error);
    return false;
  }
  return true;
}

export async function FetchTranscript(video_url: string): Promise<any> {
  // call edge function to fetch transcript
  const { data, error } = await supabase.functions.invoke('get-transcript', {
    method: 'POST',
    body: JSON.stringify({ "video_url": video_url }),
  });

  if (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Failed to fetch transcript');
  }
  console.log('Transcript data:', data);
  return data;
}

export async function FetchVideos(): Promise<any> {
  // call edge function to fetch transcript
  const { data, error } = await supabase.functions.invoke('get-videos', {
    method: 'POST',
  });

  if (error) {
    console.error('Error fetching video:', error);
    throw new Error('Failed to fetch video');
  }
  console.log('video data:', data);
  return data;
}

export async function GenerateTranscript(video_url: string): Promise<any> {
  // call edge function to fetch transcript
  const { data, error } = await supabase.functions.invoke('create-video-transcript', {
    method: 'POST',
    body: JSON.stringify({ "video_url": video_url }),
  });

  if (error) {
    console.error('Error generating transcript for video:', error);
    throw new Error('Error generating transcript for video, ');
  }
  return data;
}

export async function SyncTranscript(video_url: string): Promise<any> {
  // call edge function to fetch transcript
  const { data, error } = await supabase.functions.invoke('swift-task', {
    method: 'POST',
    body: JSON.stringify({ "video_url": video_url }),
  });

  if (error) {
    console.error('Sync transcript failed', error);
    throw new Error('Sync transcript failed' + error);
  }
  console.log('Sync stanscript successfully', data);
  return data;
}

// const baseUrl = 'https://bindev.online';
const baseUrl = 'http://localhost:5000'; // Use your local development URL

const versionApiV1 = '/v1/api';
const versionApiV2 = '/v2/api';

export async function GET_videos_v1(): Promise<any> {
  const fetch_url = `${baseUrl}${versionApiV1}/videos`;
  const response = await fetch(fetch_url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch videos');
  }

  const data = await response.json();
  return data;
}

export async function GET_transcript_status(video_url: string): Promise<any> {
  const fetch_url = `${baseUrl}${versionApiV2}/transcript-status`;
  const params = new URLSearchParams({ video_url });
  const response = await fetch(`${fetch_url}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const data = await response.json();
  console.log('Transcript status data:', data);
  return response.ok;
}


export async function GET_transcript_v2(video_url: string): Promise<any> {
  const fetch_url = `${baseUrl}${versionApiV2}/transcript`;
  const params = new URLSearchParams({ video_url });
  const response = await fetch(`${fetch_url}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch transcript');
  }

  const data = await response.json();
  return data;
}


export async function POST_Generate_Transcript(video_url: string): Promise<any> {
  
  const gen_transcript_url = `${baseUrl}${versionApiV1}/generate_transcript`;

  const response = await fetch(gen_transcript_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ video_url }),
  });

  if (!response.ok) {
    console.error('Error generating transcript for video:', response.statusText);
    throw new Error('Error generating transcript for video, ' + response.statusText);
  }
}