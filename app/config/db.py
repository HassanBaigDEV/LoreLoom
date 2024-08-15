from pymongo import MongoClient, mongo_client
from app.config.config import *

settings = get_settings()


def get_database():
    # client = MongoClient(
    #     "mongodb://localhost:27017/?directConnection=true"
    # )
    uri = settings.MONGO_URI
    # Create a new client and connect to the server
    client = MongoClient(uri)
    print(client["LoreLoom"].list_collection_names())
    # Send a ping to confirm a successful connection
    try:
        client.admin.command("ping")
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print("eeeeeeeeeeeee", e)
    # client = mongo_client.MongoClient(settings.MONGO_URI)
    return client["LoreLoom"]
