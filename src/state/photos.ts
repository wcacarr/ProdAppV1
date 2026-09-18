import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { Quest } from './types';

/**
 * Photo proof lives as a file in the app's own storage, with only its URI kept
 * in the quest. Dropping the quest would leave the image on disk, so erasing
 * data deletes the files too — otherwise "photos are erased" would not be true.
 */
export async function deletePhotos(quests: Quest[]): Promise<void> {
  if (Platform.OS === 'web') return;
  for (const quest of quests) {
    if (!quest.photoUri) continue;
    try {
      const file = new File(quest.photoUri);
      if (file.exists) file.delete();
    } catch {
      // Already gone, or outside our sandbox. Nothing useful to do.
    }
  }
}
