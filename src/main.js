const sdk = require('node-appwrite');

module.exports = async function (req, res) {
  // Configuração do Appwrite
  const client = new sdk.Client();
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const storage = new sdk.Storage(client);

  try {
    // Calcula a data de ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Busca stories criados antes de ontem
    const storiesToDelete = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID, 
      process.env.STORIES_COLLECTION_ID,
      [
        sdk.Query.lessThan('$createdAt', yesterday.toISOString())
      ]
    );

    // Itera e deleta cada story
    for (const story of storiesToDelete.documents) {
      // Primeiro, deleta o arquivo do storage
      if (story.storyUrl) {
        await storage.deleteFile(
          process.env.STORAGE_BUCKET_ID, 
          story.storyUrl
        );
      }

      // Depois, deleta o documento da coleção
      await databases.deleteDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.STORIES_COLLECTION_ID,
        story.$id
      );
    }

    res.json({
      message: `Deleted ${storiesToDelete.documents.length} old stories`
    });

  } catch (error) {
    console.error('Error deleting stories:', error);
    res.json({ error: error.message });
  }
};