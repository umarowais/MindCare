
import os

# Store Hugging Face models on D drive
os.environ["HF_HOME"] = r"D:\HuggingFaceCache"

from transformers import pipeline


# Load pretrained sentiment analysis model
print("Loading sentiment analysis model...")

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert/distilbert-base-uncased-finetuned-sst-2-english"
)

print("Sentiment model loaded successfully!")


def analyze_sentiment(text):
    """
    Analyze the sentiment of user input.
    Returns sentiment label and confidence score.
    """

    result = sentiment_pipeline(text)[0]

    return {
        "sentiment": result["label"],
        "confidence": round(result["score"], 4)
    }


# Test the model independently
if __name__ == "__main__":

    test_messages = [
        "I am feeling very happy today.",
        "I am stressed about my college exams.",
        "I feel hopeless and sad.",
        "Today is a normal day.",
        "I am excited about my future."
    ]

    for message in test_messages:
        result = analyze_sentiment(message)

        print("\nMessage:", message)
        print("Sentiment:", result["sentiment"])
        print("Confidence:", result["confidence"])
