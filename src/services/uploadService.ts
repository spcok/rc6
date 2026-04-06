import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = async (file: File, bucketName: string, folderPath: string = 'uploads') => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Supabase Storage Error:', error);
    throw new Error('Failed to upload file to the cloud.', { cause: error });
  }
};
