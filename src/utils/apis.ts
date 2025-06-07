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