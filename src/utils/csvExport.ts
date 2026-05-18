import { documentDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

export async function exportToCSV() {
  const content = 'Date,Data\n// TODO real export data here\n';
  const fileUri = (documentDirectory || '') + 'export.csv';
  await writeAsStringAsync(fileUri, content);
  if (await isAvailableAsync()) {
    await shareAsync(fileUri);
  }
}
