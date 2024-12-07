const sdk = require('node-appwrite');

module.exports = async function (req, res, context) {
  // Configuração do Appwrite
  const client = new sdk.Client();
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const storage = new sdk.Storage(client);

  try {
    context.log(process.env.APPWRITE_ENDPOINT);
    context.log(process.env.APPWRITE_PROJECT_ID);
    context.log(process.env.APPWRITE_API_KEY);
    context.log(process.env.APPWRITE_DATABASE_ID);
    context.log(process.env.STORIES_COLLECTION_ID);
    context.log(process.env.STORAGE_BUCKET_ID);

    // Calcula a data de ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    context.log('Searching for stories older than:', yesterday.toISOString());

    // Busca stories criados antes de ontem
    const storiesToDelete = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID, 
      process.env.STORIES_COLLECTION_ID,
      [
        sdk.Query.lessThan('$createdAt', yesterday.toISOString())
      ]
    );

    context.log(`Found ${storiesToDelete.documents.length} stories to delete`);

    // Itera e deleta cada story
    for (const story of storiesToDelete.documents) {
      context.log(`Processing story: ${story.$id}`);

      // Primeiro, deleta o arquivo do storage
      if (story.storyUrl) {
        try {
          await storage.deleteFile(
            process.env.STORAGE_BUCKET_ID, 
            story.storyUrl
          );
          context.log(`Deleted storage file: ${story.storyUrl}`);
        } catch (storageError) {
          context.error(`Error deleting storage file ${story.storyUrl}:`, storageError);
        }
      }

      // Depois, deleta o documento da coleção
      try {
        await databases.deleteDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.STORIES_COLLECTION_ID,
          story.$id
        );
        context.log(`Deleted document: ${story.$id}`);
      } catch (docError) {
        context.error(`Error deleting document ${story.$id}:`, docError);
      }
    }

    // Retorna o resultado usando context
    context.log(`Deleted ${storiesToDelete.documents.length} old stories`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Deleted ${storiesToDelete.documents.length} old stories`
      })
    };

  } catch (error) {
    context.error('Error deleting stories:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message 
      })
    };
  }
};