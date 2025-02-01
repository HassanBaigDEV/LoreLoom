import psycopg2
import logging
from typing import Optional, Dict, List
from pydantic import BaseModel
from llama_cpp import Llama
import uuid
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer, models
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# sentence transformers
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# model_path = r"./models/BAAI_bge-small-en-v1.5/"
# word_embedding_model = models.Transformer(model_path)
# pooling_model = models.Pooling(word_embedding_model.get_word_embedding_dimension())

# embed_model = SentenceTransformer(modules=[word_embedding_model, pooling_model])

# sentence transformers
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)

embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5", device="cuda")

# Get database configuration from environment variables
db_name = os.getenv("PG_DATABASE")
host = os.getenv("PG_HOST")
password = os.getenv("PG_PASSWORD")
port = os.getenv("PG_PORT")
user = os.getenv("PG_USER")
sslmode = os.getenv("PG_SSLMODE")


def get_db_connection():
    conn = psycopg2.connect(
        dbname=db_name,
        host=host,
        password=password,
        port=port,
        user=user,
        sslmode=sslmode,
    )
    conn.autocommit = True
    register_vector(conn)
    return conn


# with conn.cursor() as c:
#     c.execute(f"DROP DATABASE IF EXISTS {db_name}")
#     c.execute(f"CREATE DATABASE {db_name}")


def store_story_part(part_name: str, story_id: str, part_text: str, text: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    embedding = embed_model.get_text_embedding(text)
    story_id_str = str(story_id)

    try:
        # Insert the story part into the table
        insert_query = """
            INSERT INTO vectors (part_name,story_id,part_text, embedding) 
            VALUES (%s, %s, %s, %s)
        """
        # first 10 elements of the embedding
        print("dddddddddddddddddd")
        print(embedding[:5])
        # _id =
        cursor.execute(insert_query, (part_name, story_id_str, part_text, embedding))
        conn.commit()
        logging.info(f"Stored {part_name} in the database successfully.")
    except Exception as e:
        logging.error(f"Failed to store {part_name}: {e}")
    finally:
        cursor.close()
        conn.close()


def find_similar_parts(part_name: str, story_id: str, text: str, top_n: int = 5):
    conn = get_db_connection()
    cursor = conn.cursor()
    story_id_str = str(story_id)

    try:
        embedding = embed_model.get_text_embedding(text)

        # Query the database for top_n similar parts
        # select_query = """
        #     SELECT part_text, embedding ,<-> %s AS distance
        #     FROM vectors
        #     WHERE part_name = %s
        #     ORDER BY distance
        #     LIMIT %s
        # """

        embedding_vector = str(embedding)
        # Convert to PostgreSQL array format
        print(embedding_vector[:10])

        # Use the embedding vector in the query
        select_query = f"""
            SELECT part_text
            FROM vectors 
            WHERE part_name = %s 
            AND story_id = %s
            ORDER BY embedding <-> '{embedding_vector}'::vector 
            LIMIT %s
        """

        cursor.execute(select_query, (part_name, story_id_str, top_n))
        similar_parts = cursor.fetchall()

        logging.info(f"Found {len(similar_parts)} similar {part_name}(s).")
        return similar_parts
    except Exception as e:
        logging.error(f"Failed to find similar {part_name}(s): {e}")
    finally:
        cursor.close()
        conn.close()


# vector_store = PGVectorStore.from_params(
#     database=db_name,
#     host=host,
#     password=password,
#     port=port,
#     user=user,
#     table_name="vectors",
#     embed_dim=4096,  # embedding dimension (make sure it matches the model)
# )

# logging.info(f"Vector store connected:")
