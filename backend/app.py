
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from sentiment import analyze_sentiment
from safety import detect_safety_risk
from database import (
    init_db,
    save_conversation,
    save_mood,
    get_moods,
    save_mood_insight,
    get_mood_insights,
    save_completed_activity,
    get_completed_activities,
    get_weekly_completed_activities,
    get_chat_history,
    get_activity_dates
)
import sqlite3
from datetime import datetime, timedelta

# Load environment variables
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Initialize Gemini
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in backend/.env")

client = genai.Client(api_key=api_key)

app = Flask(__name__)
CORS(app)

init_db()


@app.route("/")
def home():
    return jsonify({
        "project": "MindCare",
        "message": "Welcome to MindCare API",
        "status": "running"
    })


@app.route("/health")
def health():
    return jsonify({"status": "healthy"})


# Chat API
@app.route("/api/chat", methods=["POST"])
def chat():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Invalid JSON request"}), 400

    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"error": "Message cannot be empty"}), 400
    
    # STEP 1: Check for safety risks
    safety_result = detect_safety_risk(user_message)
    risk_level = safety_result["risk_level"]
    print("Safety Risk:", risk_level, flush=True)

    if risk_level in ["high", "immediate", "third_party", "negated"]:

        if risk_level == "immediate":
            safety_reply = (
                "I'm really sorry you're going through this. "
                "Your safety matters. If you may hurt yourself right now, "
                "please move away from anything you could use to harm yourself. "
                "Contact someone you trust and ask them to stay with you. "
                "If you are in immediate danger, contact local emergency "
                "services or go to the nearest emergency department. "
                "You don't have to face this alone."
            )
        elif risk_level == "negated":
            safety_reply = (
                "Thank you for clarifying. I won't assume that you're "
                "thinking about hurting yourself. I'm here to listen "
                "and support you. What's on your mind today?"
            )
        
    #     elif risk_level == "third_party":
    #         safety_reply = (
    #     "It's thoughtful of you to be concerned about your sister. "
    #     "Please listen to her calmly and without judgment. "
    #     "Encourage her to speak with a trusted person or mental health professional. "
    #     "If she may be in immediate danger, contact local emergency services "
    #     "and help her stay with someone safe."
    # )
    

            
        else:
            safety_reply = (
                "I'm sorry things feel so difficult right now. "
                "Thank you for sharing this with me. You deserve support. "
                "Consider reaching out to someone you trust or a mental "
                "health professional. Would you feel comfortable telling "
                "someone close to you how you're feeling?"
            )
        
        

        # Save safety-related conversation
        save_conversation(
            user_message,
            safety_reply,
            "UNKNOWN",
            0.0
        )

        return jsonify({
            "user_message": user_message,
            "reply": safety_reply,
            "sentiment": "UNKNOWN",
            "confidence": 0.0,
            "risk_level": risk_level,
            "status": "success"
        })

    # Continue with normal sentiment analysis and Gemini response


    try:
        # STEP 1: Analyze sentiment using DistilBERT
        try:
            sentiment_result = analyze_sentiment(user_message)

            sentiment = sentiment_result["sentiment"]
            confidence = sentiment_result["confidence"]

        except Exception as e:
            print("Sentiment Analysis Error:", str(e))
            sentiment = "UNKNOWN"
            confidence = 0.0

        print("Detected Sentiment:", sentiment)
        print("Confidence:", confidence)
        
                # STEP 1.5: Check safety risk
        safety_result = detect_safety_risk(user_message)
        risk_level = safety_result["risk_level"]

        print("Safety Risk:", risk_level, flush=True)

        if risk_level == "immediate":
            bot_response = (
                "I'm really sorry you're going through this. "
                "Your safety is the priority right now. If you may hurt "
                "yourself or are in immediate danger, please contact "
                "emergency services or go to the nearest emergency department. "
                "If possible, move away from anything you could use to hurt "
                "yourself and reach out to someone you trust. "
                "You don't have to face this alone."
            )

        elif risk_level == "high":
            bot_response = (
                "I'm sorry things feel so difficult right now. "
                "You deserve support, and you don't have to handle this alone. "
                "Please consider contacting someone you trust or a mental "
                "health professional. Are you safe right now?"
            )

        elif risk_level == "third_party":
            bot_response = (
        "It sounds like you're concerned about someone else's safety. "
        "Please take their words seriously, listen without judgment, "
        "and encourage them to seek professional support. "
        "If they are in immediate danger, contact emergency services."
    )

        elif risk_level == "negated":
            bot_response = (
        "Thank you for clarifying. I won't assume that you're "
        "thinking about hurting yourself. I'm here to listen "
        "and support you. What's on your mind today?"
    )

        else:
            bot_response = None
            

        if bot_response:
            save_conversation(
                user_message,
                bot_response,
                sentiment,
                confidence
            )

            return jsonify({
                "user_message": user_message,
                "reply": bot_response,
                "sentiment": sentiment,
                "confidence": confidence,
                "risk_level": risk_level,
                "status": "success"
            })
        

        # STEP 2: Generate response using Gemini
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",

            contents=f"""
You are MindCare, a friendly and supportive mental wellness chatbot.

YOUR PERSONALITY:
- Be empathetic, kind, patient and non-judgmental.
- Listen carefully to the user's emotions.
- Use simple, natural English.
- Never make the user feel judged.

SENTIMENT ANALYSIS:
The sentiment model detected: {sentiment}
Confidence score: {confidence}

Use this sentiment only as supporting context.
Do not assume the user feels a particular emotion
based only on this classification.
Prioritize what the user actually says.

RESPONSE RULES:
1. Keep normal responses between 80 and 150 words.
2. Start by acknowledging the user's feelings.
3. Give only 1 or 2 practical suggestions.
4. Avoid unnecessary explanations and repetition.
5. Ask only ONE relevant follow-up question.
6. Use short paragraphs.
7. Avoid lengthy introductions.
8. Do not repeat the user's entire message.
9. Avoid unnecessary headings and markdown.

IMPORTANT SAFETY RULES:
- Never diagnose mental health conditions.
- Never recommend medication.
- Never claim to replace a mental health professional.
- If the user expresses suicidal thoughts or immediate danger,
  prioritize safety and encourage immediate professional
  or emergency support.
- Do not rely on sentiment classification alone for crisis detection.

User message: {user_message}
""",

            config={
                "temperature": 0.6,
                "max_output_tokens": 250
            }
        )

        bot_response = response.text

        if not bot_response:
            raise ValueError("Gemini returned an empty response")
            # Save conversation in SQLite
        save_conversation(
            user_message,
            bot_response,
            sentiment,
            confidence
        )

        # STEP 3: Return everything to React
        return jsonify({
            "user_message": user_message,
            "reply": bot_response,
            "sentiment": sentiment,
            "confidence": confidence,
            "status": "success"
        })

    except Exception as e:
        print("Gemini API Error:", str(e))

        return jsonify({
            "error": "Unable to generate a response. Please try again."
        }), 500
        
        # Save manually selected mood
@app.route("/api/mood", methods=["POST"])
def add_mood():

    data = request.get_json(silent=True) or {}

    mood = data.get("mood", "").strip()
    note = data.get("note", "").strip()

    allowed_moods = [
        "Happy", "Sad", "Stressed",
        "Anxious", "Calm", "Angry"
    ]

    if mood not in allowed_moods:
        return jsonify({"error": "Invalid mood"}), 400

    save_mood(mood, note)

    return jsonify({
        "message": "Mood saved successfully",
        "mood": mood,
        "status": "success"
    })


# Get mood history
@app.route("/api/moods", methods=["GET"])
def mood_history():

    moods = get_moods()

    return jsonify({
        "moods": moods,
        "status": "success"
    })

@app.route("/api/analytics", methods=["GET"])
def mood_analytics():

    try:
        # Connect to existing SQLite database
        db_path = os.path.join(
            os.path.dirname(__file__),
            "mindcare.db"
        )

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Total mood entries
        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM mood_entries
        """)

        total_entries = cursor.fetchone()["total"]

        # 2. Mood distribution
        cursor.execute("""
            SELECT mood, COUNT(*) AS count
            FROM mood_entries
            GROUP BY mood
            ORDER BY count DESC
        """)

        distribution = [
            dict(row) for row in cursor.fetchall()
        ]

        # 3. Most frequent mood
        most_common_mood = (
            distribution[0]["mood"]
            if distribution else None
        )

        # 4. Weekly mood trends
        cursor.execute("""
            SELECT
                date(created_at, 'localtime') AS day,
                COUNT(*) AS total
            FROM mood_entries
            WHERE date(created_at, 'localtime')
                  >= date('now', 'localtime', '-6 days')
            GROUP BY day
            ORDER BY day ASC
        """)

        daily_data = {
            row["day"]: row["total"]
            for row in cursor.fetchall()
        }

        conn.close()

        # Include days with zero mood entries
        today = datetime.now().date()

        weekly_trend = []

        for i in range(6, -1, -1):

            day = today - timedelta(days=i)
            day_string = day.strftime("%Y-%m-%d")

            weekly_trend.append({
                "date": day_string,
                "total": daily_data.get(day_string, 0)
            })

        return jsonify({
            "total_entries": total_entries,
            "most_common_mood": most_common_mood,
            "mood_distribution": distribution,
            "weekly_trend": weekly_trend,
            "status": "success"
        })

    except Exception as e:
        print("Analytics API Error:", str(e))

        return jsonify({
            "error": "Unable to fetch mood analytics"
        }), 500
        
@app.route("/api/mood-insights", methods=["GET"])
def mood_insights():
        try:
            moods = get_moods()

            if not moods:
                return jsonify({
                    "status": "success",
                    "insight": "Start recording your moods to receive personal insights."
                })

            # Use the 7 most recent manually recorded moods
            recent_moods = moods[:7]

            mood_summary = "\n".join([
                f"{entry['created_at']}: {entry['mood']}"
                for entry in recent_moods
            ])

            prompt = f"""
            You are MindCare, a supportive wellness assistant.

            Analyze these manually recorded mood entries:
            {mood_summary}

            Generate:
            1. One short observation about the recorded mood pattern.
            2. One gentle, practical suggestion.

            Keep the response between 50 and 80 words.
            Be empathetic and non-judgmental.
            Do not diagnose any mental health condition.
            Do not assume that recorded moods represent the user's
            complete emotional state.
            """

            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt
            )
            save_mood_insight(response.text)

            return jsonify({
                "status": "success",
                "insight": response.text
            })
            

        except Exception as e:
            print("Mood insight error:", str(e))
            return jsonify({
                "status": "error",
                "message": "Unable to generate mood insights right now."
            }), 500
@app.route("/api/mood-insights/history", methods=["GET"])
def mood_insights_history():
    try:
        insights = get_mood_insights()

        return jsonify({
            "status": "success",
            "insights": insights
        })

    except Exception as e:
        print("Mood history error:", str(e))

        return jsonify({
            "status": "error",
            "message": "Unable to load mood insights history."
        }), 500
        
        
        # Mood-Based Personalized Recommendations

@app.route("/api/recommendations", methods=["GET"])
def get_recommendations():
    try:
        moods = get_moods()

        if not moods:
            return jsonify({
                "status": "success",
                "mood": None,
                "recommendations": [],
                "message": "Record your mood to receive personalized recommendations."
            })

        # Get the latest manually selected mood
        latest_mood = moods[0]["mood"]

        recommendation_data = {
            "Happy": [
                {
                    "title": "Practice Gratitude",
                    "description": "Write down three things that made you happy today.",
                    "icon": "🌻"
                },
                {
                    "title": "Celebrate Small Wins",
                    "description": "Take a moment to appreciate something you accomplished.",
                    "icon": "🎉"
                }
            ],

            "Sad": [
                {
                    "title": "Listen to Music",
                    "description": "Listen to something comforting and relaxing.",
                    "icon": "🎵"
                },
                {
                    "title": "Connect With Someone",
                    "description": "Consider talking to someone you trust.",
                    "icon": "💬"
                }
            ],

            "Stressed": [
                {
                    "title": "Try Deep Breathing",
                    "description": "Breathe slowly and gently for a few minutes.",
                    "icon": "🌿"
                },
                {
                    "title": "Take a Short Break",
                    "description": "Step away from your work and stretch.",
                    "icon": "🚶"
                }
            ],

            "Anxious": [
                {
                    "title": "5-4-3-2-1 Grounding",
                    "description": "Notice 5 things you see, 4 you feel, 3 you hear, 2 you smell and 1 you taste.",
                    "icon": "🌱"
                },
                {
                    "title": "Slow Your Breathing",
                    "description": "Take a few comfortable, slow breaths without forcing them.",
                    "icon": "🧘"
                }
            ],

            "Calm": [
                {
                    "title": "Practice Mindfulness",
                    "description": "Spend a few minutes noticing the present moment.",
                    "icon": "🧘"
                },
                {
                    "title": "Maintain Your Routine",
                    "description": "Continue the healthy habits that help you feel balanced.",
                    "icon": "🌸"
                }
            ],

            "Angry": [
                {
                    "title": "Pause and Reflect",
                    "description": "Give yourself a little time before responding to a difficult situation.",
                    "icon": "🌿"
                },
                {
                    "title": "Take a Quiet Walk",
                    "description": "If comfortable, take a short walk and give yourself space.",
                    "icon": "🚶"
                }
            ]
        }

        recommendations = recommendation_data.get(
            latest_mood, []
        )

        return jsonify({
            "status": "success",
            "mood": latest_mood,
            "recommendations": recommendations
        })

    except Exception as e:
        print("Recommendation error:", str(e))

        return jsonify({
            "status": "error",
            "message": "Unable to load recommendations."
        }), 500
        
@app.route("/api/activities/complete", methods=["POST"])
def complete_activity():
            try:
                data = request.get_json(silent=True) or {}
                activity_title = data.get("activity_title", "").strip()

                if not activity_title:
                    return jsonify({
                        "status": "error",
                        "message": "Activity title is required."
                    }), 400

                if len(activity_title) > 150:
                    return jsonify({
                        "status": "error",
                        "message": "Activity title is too long."
                    }), 400

                saved = save_completed_activity(activity_title)

                return jsonify({
                    "status": "success",
                    "message": (
                        "Activity completed successfully."
                        if saved else "Activity was already completed today."
                    ),
                    "saved": saved
                })

            except Exception as e:
                print("Activity completion error:", str(e))
                return jsonify({
                    "status": "error",
                    "message": "Unable to save activity completion."
                }), 500
        
@app.route("/api/activities/completed", methods=["GET"])
def completed_activities():
            try:
                activities = get_completed_activities()

                return jsonify({
                    "status": "success",
                    "activities": activities,
                    "total_completed": len(activities)
                })

            except Exception as e:
                print("Activity progress error:", str(e))
                return jsonify({
                    "status": "error",
                    "message": "Unable to load completed activities."
                }), 500

@app.route("/api/activities/weekly", methods=["GET"])
def weekly_completed_activities():
    try:
        activities = get_weekly_completed_activities()

        return jsonify({
            "status": "success",
            "activities": activities
        })

    except Exception as e:
        print("Weekly activity error:", str(e))

        return jsonify({
            "status": "error",
            "message": "Unable to load weekly activities."
        }), 500

# this api we created for calculating the streak
@app.route("/api/activities/streak", methods=["GET"])
def activity_streak():
    try:
        activity_dates = get_activity_dates()

        dates = {
            datetime.strptime(day, "%Y-%m-%d").date()
            for day in activity_dates
        }

        today = datetime.now().date()
        yesterday = today - timedelta(days=1)

        # Calculate current streak
        if today in dates:
            start_date = today
        elif yesterday in dates:
            start_date = yesterday
        else:
            start_date = None

        current_streak = 0

        if start_date:
            check_date = start_date

            while check_date in dates:
                current_streak += 1
                check_date -= timedelta(days=1)

        # Calculate longest streak
        longest_streak = 0
        running_streak = 0
        previous_date = None

        for day in sorted(dates):
            if previous_date is not None and (
                day - previous_date
            ).days == 1:
                running_streak += 1
            else:
                running_streak = 1

            longest_streak = max(
                longest_streak, running_streak
            )
            previous_date = day

        return jsonify({
            "status": "success",
            "current_streak": current_streak,
            "longest_streak": longest_streak
        })

    except Exception as e:
        print("Activity streak error:", str(e))
        return jsonify({
            "status": "error",
            "message": "Unable to calculate activity streak."
        }), 500
        
@app.route("/api/chat-history", methods=["GET"])
def chat_history():
        try:
            conversations = get_chat_history()

            return jsonify({
                "status": "success",
                "conversations": conversations
            }), 200

        except Exception as e:
            print("Chat History Error:", e)

            return jsonify({
                "error": "Unable to fetch chat history"
            }), 500
                
        
        


if __name__ == "__main__":
    app.run(debug=True, port=5000)
