// src/lib/backendJobs.ts


import type { ConvertedFile } from '@/types/converter';

interface JobResponse {
  success: boolean;
  job_id: string;
}

interface JobStatusResponse {
  status: 'pending' | 'success' | 'failed';
  result_url?: string;
  error?: string;
}

/**
 * Backend base URL (from environment variable)
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Submit files for conversion
 */
export async function submitJob(
  files: File[],
  conversionType: string
): Promise<JobResponse> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  formData.append('conversion_type', conversionType);

  const resp = await fetch(`${BACKEND_URL}/api/jobs`, { method: 'POST', body: formData });
  if (!resp.ok) throw new Error('Failed to submit job');
  return resp.json();
}

/**
 * Poll job status until complete and fetch the resulting file blob
 */
export async function waitForJobResult(
  jobId: string,
  interval = 2000
): Promise<ConvertedFile> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`);
        const data: JobStatusResponse = await resp.json();

        if (data.status === 'success' && data.result_url) {
          const fileResp = await fetch(data.result_url);
          const blob = await fileResp.blob();

          resolve({
            name: `converted-file.${jobId}.pptx`,
            url: data.result_url,
            blob,
          });
        } else if (data.status === 'failed') {
          reject(new Error(data.error || 'Conversion failed'));
        } else {
          setTimeout(poll, interval);
        }
      } catch (err) {
        setTimeout(poll, interval);
      }
    };
    poll();
  });
}
