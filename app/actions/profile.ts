'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const userId = formData.get('userId') as string;

  const { error } = await supabase
    .from('users')
    .update({ name, phone })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}

export async function uploadAvatarAction(formData: FormData) {
  const supabase = await createClient();
  
  const file = formData.get('avatar') as File;
  const userId = formData.get('userId') as string;
  const oldAvatarUrl = formData.get('oldAvatarUrl') as string;

  if (!file || !userId) {
    return { success: false, error: 'Faltan datos requeridos' };
  }

  // Delete old avatar if exists
  if (oldAvatarUrl) {
    try {
      // Extract the path from the public URL
      // Example: https://.../storage/v1/object/public/avatars/userId/filename.jpg
      const urlParts = oldAvatarUrl.split('/avatars/');
      if (urlParts.length > 1) {
        const oldPath = urlParts[1];
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    } catch (e) {
      console.error('Error deleting old avatar:', e);
      // We continue even if deletion fails to not block the new upload
    }
  }

  // Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update user record with new avatar URL
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/profile');
  return { success: true, avatarUrl: publicUrl };
}
