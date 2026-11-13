import { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  LayoutDashboard,
  Smile,
  Send,
  UserRound,
  CalendarDays,
  TrendingUp,
  LoaderCircle,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  // const [activePage, setActivePage] = useState("Chat");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! Welcome to MindCare. 💜 I'm here to listen. How are you feeling today?"
    }
  ]);
  // Mood Tracker states
  const [selectedMood, setSelectedMood] = useState("");
  const [moodNote, setMoodNote] = useState("");
  const [moodHistory, setMoodHistory] = useState([]);

  const [moodLoading, setMoodLoading] = useState(false);
  const [moodError, setMoodError] = useState("");
  const [moodSuccess, setMoodSuccess] = useState("");
  const [analytics, setAnalytics] = useState(null);
const [analyticsLoading, setAnalyticsLoading] = useState(false);
const [analyticsError, setAnalyticsError] = useState("");
const [moodInsight, setMoodInsight] = useState("");
const [insightLoading, setInsightLoading] = useState(false);
const [insightHistory, setInsightHistory] = useState([]);
const [historyLoading, setHistoryLoading] = useState(false);
const [recommendations, setRecommendations] = useState([]);
const [recommendationMood, setRecommendationMood] = useState("");
const [recommendationLoading, setRecommendationLoading] = useState(false);
const [completedActivities, setCompletedActivities] = useState([]);
const [activityFilter, setActivityFilter] = useState("Today");
const [streakData, setStreakData] = useState({
  current_streak: 0,
  longest_streak: 0
});

const [streakLoading, setStreakLoading] = useState(false);
const [chatSearch, setChatSearch] = useState("");

// Chat History states
const [chatHistory, setChatHistory] = useState([]);
const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
const [chatHistoryError, setChatHistoryError] = useState("");
const [chatDate, setChatDate] = useState("");
// Fetch Chat History
const fetchChatHistory = async () => {
  setChatHistoryLoading(true);
  setChatHistoryError("");

  try {
    const response = await fetch(
      "http://127.0.0.1:5000/api/chat-history"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch chat history");
    }

    const data = await response.json();

    setChatHistory(data.conversations || []);
  } catch (error) {
    console.error("Chat History Error:", error);
    setChatHistoryError("Unable to load chat history.");
  } finally {
    setChatHistoryLoading(false);
  }
};

// Load Chat History when the page opens
useEffect(() => {
  if (activePage === "Chat History") {
    fetchChatHistory();
  }
}, [activePage]);

const filteredActivities = completedActivities.filter((activity) => {
  const today = new Date();

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const todayString = formatDate(today);

  if (activityFilter === "Today") {
    return activity.activity_date === todayString;
  }

  if (activityFilter === "This Week") {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const weekStartString = formatDate(weekStart);

    

    return (
      activity.activity_date >= weekStartString &&
      activity.activity_date <= todayString
    );
  }

  return true;
});


const [activityLoading, setActivityLoading] = useState("");
const [dailyGoal] = useState(2);
const [weeklyActivities, setWeeklyActivities] = useState([]);

// this is for calculationg percentage automatically from sqlite records
const completedCount = completedActivities.length;

const progressPercentage = Math.min(
  (completedCount / dailyGoal) * 100,
  100
);

  const handleSend = async () => {
    const userMessage = message.trim();

    if (!userMessage || isLoading) return;

    // 1. Display user's message
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userMessage }
    ]);

    // 2. Clear input
    setMessage("");

    // 3. Show loading status
    setIsLoading(true);

    try {
      // 4. Send request to Flask backend
      const response = await fetch(
        "http://127.0.0.1:5000/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: userMessage
          })
        }
      );

      // 5. Read backend response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      // 6. Display bot response
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.reply }
      ]);

    } catch (error) {
      console.error("Chat API Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I couldn't connect to the server. Please try again."
        }
      ]);

    } finally {
      // 7. Stop loading
      setIsLoading(false);
    }
  };
  const moodOptions = [
  { name: "Happy", emoji: "😊", color: "bg-yellow-100" },
  { name: "Sad", emoji: "😢", color: "bg-blue-100" },
  { name: "Stressed", emoji: "😰", color: "bg-orange-100" },
  { name: "Anxious", emoji: "😟", color: "bg-purple-100" },
  { name: "Calm", emoji: "😌", color: "bg-green-100" },
  { name: "Angry", emoji: "😠", color: "bg-red-100" },
];


const fetchMoodHistory = async () => {
  setHistoryLoading(true);
  setMoodError("");

  try {
    const response = await fetch(
      "http://127.0.0.1:5000/api/moods"
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch moods");
    }

    setMoodHistory(data.moods || []);

  } catch (error) {
    console.error("Mood History Error:", error);
    setMoodError("Unable to load mood history.");

  } finally {
    setHistoryLoading(false);
  }
};



const handleMoodSave = async () => {
  if (!selectedMood || moodLoading) return;

  setMoodLoading(true);
  setMoodError("");
  setMoodSuccess("");

  try {
    const response = await fetch(
      "http://127.0.0.1:5000/api/mood",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mood: selectedMood,
          note: moodNote
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to save mood");
    }

    setMoodSuccess("Your mood has been saved successfully! 💜");

    setSelectedMood("");
    setMoodNote("");

    // Refresh history after saving
    await fetchMoodHistory();
    // Refresh dashboard analytics
await fetchAnalytics();

  } catch (error) {
    console.error("Mood Save Error:", error);
    setMoodError("Unable to save your mood. Please try again.");

  } finally {
    setMoodLoading(false);
  }
};
useEffect(() => {
  if (activePage === "Mood Tracker") {
    fetchMoodHistory();
  }
}, [activePage]);

const fetchAnalytics = async () => {
  setAnalyticsLoading(true);
  setAnalyticsError("");

  try {
    const response = await fetch(
      "http://127.0.0.1:5000/api/analytics"
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load analytics");
    }

    setAnalytics(data);

  } catch (error) {
    console.error("Analytics Error:", error);
    setAnalyticsError("Unable to load analytics.");

  } finally {
    setAnalyticsLoading(false);
  }
};
useEffect(() => {
  if (activePage === "Dashboard") {
    fetchAnalytics();
     fetchRecommendations();
     fetchCompletedActivities();
     fetchWeeklyActivities();
     fetchActivityStreak();

  }
}, [activePage]);

const fetchMoodInsight = async () => {
  try {
    setInsightLoading(true);

    const response = await fetch(
      "http://127.0.0.1:5000/api/mood-insights"
    );

    const data = await response.json();

    if (data.status === "success") {
      setMoodInsight(data.insight);
      await fetchInsightHistory();
    }
  } catch (error) {
    console.error("Mood insight error:", error);
  } finally {
    setInsightLoading(false);
  }
};
useEffect(() => {
  if (activePage === "Dashboard") {
    fetchMoodInsight();

  }
}, [activePage]);

const fetchInsightHistory = async () => {
  try {
    setHistoryLoading(true);

    const response = await fetch(
      "http://127.0.0.1:5000/api/mood-insights/history"
    );

    const data = await response.json();

    if (data.status === "success") {
      setInsightHistory(data.insights);
    }
  } catch (error) {
    console.error("Insight history error:", error);
  } finally {
    setHistoryLoading(false);
  }
};

const fetchRecommendations = async () => {
  try {
    setRecommendationLoading(true);

    const response = await fetch(
      "http://127.0.0.1:5000/api/recommendations"
    );

    const data = await response.json();

    if (data.status === "success") {
      setRecommendations(data.recommendations);
      setRecommendationMood(data.mood || "");
    }
  } catch (error) {
    console.error("Recommendation error:", error);
  } finally {
    setRecommendationLoading(false);
  }
};

const fetchActivityStreak = async () => {
  try {
    setStreakLoading(true);

    const response = await fetch(
      "http://127.0.0.1:5000/api/activities/streak"
    );

    const data = await response.json();

    if (data.status === "success") {
      setStreakData(data);
    }
  } catch (error) {
    console.error("Streak loading error:", error);
  } finally {
    setStreakLoading(false);
  }
};

const fetchCompletedActivities = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:5000/api/activities/completed"
    );

    const data = await response.json();

    if (data.status === "success") {
      setCompletedActivities(data.activities);
    }
  } catch (error) {
    console.error("Error loading completed activities:", error);
  }
};

const handleCompleteActivity = async (activityTitle) => {
  try {
    setActivityLoading(activityTitle);

    const response = await fetch(
      "http://127.0.0.1:5000/api/activities/complete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activity_title: activityTitle,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to complete activity");
    }

    await fetchCompletedActivities();

  } catch (error) {
    console.error("Completion error:", error);
    alert(error.message);
  } finally {
    setActivityLoading("");
  }
};

const fetchWeeklyActivities = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:5000/api/activities/weekly"
    );

    const data = await response.json();

    if (data.status === "success") {
      const today = new Date();

      const lastSevenDays = Array.from(
        { length: 7 },
        (_, index) => {
          const date = new Date(today);
          date.setDate(today.getDate() - (6 - index));

          const dateString = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
          ].join("-");

          const matchingDay = data.activities.find(
            (item) => item.activity_date === dateString
          );

          return {
            day: date.toLocaleDateString("en-US", {
              weekday: "short",
            }),
            total: matchingDay ? matchingDay.total : 0,
          };
        }
      );

      setWeeklyActivities(lastSevenDays);
    }
  } catch (error) {
    console.error("Weekly activity error:", error);
  }
};


const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const normalized = timestamp.includes("T")
    ? timestamp
    : timestamp.replace(" ", "T");

  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized);

  const date = new Date(
    hasTimezone ? normalized : `${normalized}Z`
  );

  if (isNaN(date.getTime())) return timestamp;

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

const filteredChatHistory = chatHistory.filter((chat) => {
  const matchesSearch = chat.user_message
    .toLowerCase()
    .includes(chatSearch.toLowerCase());

  const chatDateOnly = new Date(chat.created_at)
    .toLocaleDateString("en-CA");

  const matchesDate = !chatDate || chatDateOnly === chatDate;

  return matchesSearch && matchesDate;
});

return (
    <div className="min-h-screen bg-[#F8F6FC] flex">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 hidden md:flex flex-col">

        <div className="flex items-center gap-2 mb-12">
          <Heart className="text-purple-600" size={30} />
          <h1 className="text-2xl font-bold text-purple-700">
            MindCare
          </h1>
        </div>

        <p className="text-xs text-gray-400 font-semibold mb-4">
          MENU
        </p>

        <nav className="space-y-3">

          <button
            onClick={() => setActivePage("Dashboard")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl ${
              activePage === "Dashboard"
                ? "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>

          <button
            onClick={() => setActivePage("Chat")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl ${
              activePage === "Chat"
                ? "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <MessageCircle size={20} />
            Chat Support
          </button>

          <button
  onClick={() => setActivePage("Chat History")}
  className={`w-full flex items-center gap-3 p-3 rounded-xl ${
    activePage === "Chat History"
      ? "bg-purple-100 text-purple-700"
      : "text-gray-600 hover:bg-gray-100"
  }`}
>
  <CalendarDays size={20} />
  Chat History
</button>

          <button
            onClick={() => setActivePage("Mood Tracker")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl ${
              activePage === "Mood Tracker"
                ? "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Smile size={20} />
            Mood Tracker
          </button>

        </nav>

        <div className="mt-auto bg-purple-50 rounded-2xl p-4">
          <Heart className="text-purple-600 mb-2" />
          <p className="text-sm font-semibold text-gray-700">
            Your mental well-being matters.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Take one step at a time.
          </p>
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-5 flex justify-between items-center">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {activePage}
            </h2>
            <p className="text-sm text-gray-500">
              Your personal wellness space
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <UserRound className="text-purple-700" />
            </div>
          </div>

        </header>

        {/* Chat Area */}
        {activePage === "Chat" && (
          <section className="flex-1 flex flex-col p-6 max-w-5xl w-full mx-auto">

            <div className="flex-1 overflow-y-auto space-y-5 py-4">

              <div className="text-center mb-8">
                <div className="bg-purple-100 inline-flex p-4 rounded-full mb-3">
                  <Heart className="text-purple-700" size={32} />
                </div>

                <h2 className="text-2xl font-bold text-gray-800">
                  How are you feeling today?
                </h2>

                <p className="text-gray-500 mt-2">
                  You can share what's on your mind.
                </p>
              </div>

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-purple-600 text-white rounded-br-sm"
                        : "bg-white text-gray-700 shadow-sm rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="text-sm text-purple-600">
                  MindCare is processing your message...
                </div>
              )}

            </div>

            {/* Message Input */}
            <div className="bg-white border border-gray-200 rounded-2xl p-3 flex gap-3 shadow-sm">

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Share what's on your mind..."
                className="flex-1 outline-none px-3 text-gray-700 min-w-0"
              />

              <button
                onClick={handleSend}
                disabled={isLoading || !message.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-3 rounded-xl"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>

            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              MindCare provides supportive information, not professional diagnosis or treatment.
            </p>

          </section>
        )}

{activePage === "Dashboard" && (
  <section className="p-6 md:p-8 flex-1 overflow-y-auto">

    {/* Dashboard Heading */}
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800">
        Welcome to MindCare 💜
      </h2>
      <p className="text-gray-500 mt-2">
        Understand your emotions and track your mental wellness.
      </p>
    </div>

    {analyticsLoading && (
      <p className="text-purple-600">Loading analytics...</p>
    )}

    {analyticsError && (
      <p className="text-red-500">{analyticsError}</p>
    )}

    {analytics && (
      <>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <p className="text-gray-500 text-sm">
              Total Mood Entries
            </p>
            <h3 className="text-3xl font-bold text-purple-600 mt-3">
              {analytics.total_entries}
            </h3>
            <p className="text-sm text-gray-400 mt-2">
              All recorded moods
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <p className="text-gray-500 text-sm">
              Most Frequent Mood
            </p>
            <h3 className="text-2xl font-bold text-purple-600 mt-3">
              {analytics.most_common_mood || "No data"}
            </h3>
            <p className="text-sm text-gray-400 mt-2">
              Your most recorded emotion
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <p className="text-gray-500 text-sm">
              Mood Types Recorded
            </p>
            <h3 className="text-3xl font-bold text-purple-600 mt-3">
              {analytics.mood_distribution.length}
            </h3>
            <p className="text-sm text-gray-400 mt-2">
              Different emotions tracked
            </p>
          </div>
          

        </div>

{/* Activity Streak Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 mb-6">

  {/* Current Streak */}
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-200">
    <p className="text-gray-500 text-sm">
      🔥 Current Streak
    </p>

    <h3 className="text-3xl font-bold text-purple-600 mt-3">
      {streakLoading ? "..." : streakData.current_streak}
      <span className="text-base ml-2">Days</span>
    </h3>

    <p className="text-sm text-gray-400 mt-2">
      Consecutive days with completed activities
    </p>
  </div>

  {/* Longest Streak */}
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-200">
    <p className="text-gray-500 text-sm">
      🏆 Longest Streak
    </p>

    <h3 className="text-3xl font-bold text-purple-600 mt-3">
      {streakLoading ? "..." : streakData.longest_streak}
      <span className="text-base ml-2">Days</span>
    </h3>

    <p className="text-sm text-gray-400 mt-2">
      Your personal best activity streak
    </p>
  </div>

</div>


        

{/* Daily Wellness Progress */}
<div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-200 mt-6">
  <div className="flex justify-between items-center mb-3">
    <h3 className="text-lg font-semibold text-gray-800">
      🌿 Daily Wellness Progress
    </h3>

    <span className="text-purple-700 font-bold">
      {completedCount}/{dailyGoal}
    </span>
  </div>

  <div className="w-full bg-gray-200 rounded-full h-3">
    <div
      className="bg-purple-600 h-3 rounded-full transition-all duration-500"
      style={{ width: `${progressPercentage}%` }}
    ></div>
  </div>

  <p className="text-sm text-gray-500 mt-3">
    {completedCount >= dailyGoal
      ? "Amazing! You've reached your daily wellness goal! 🎉"
      : `${dailyGoal - completedCount} more activities to reach your daily goal.`}
  </p>
</div>


{/* Weekly Wellness Activity */}
<div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-purple-200">
  <div className="mb-5">
    <h3 className="text-lg font-semibold text-gray-800">
      Weekly Wellness Activity
    </h3>
    <p className="text-sm text-gray-500 mt-1">
      Your completed activities over the last 7 days.
    </p>
  </div>

  <div className="w-full h-72">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={weeklyActivities}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar
          dataKey="total"
          fill="#A855F7"
          radius={[6, 6, 0, 0]}
          name="Completed Activities"
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>



{/* Completed Wellness Activity History */}
<div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-purple-200">


<div className="flex items-center justify-between mb-5">
  <div>
    <h3 className="text-lg font-semibold text-gray-800">
      Completed Activity History
    </h3>
    <p className="text-sm text-gray-500 mt-1">
      Your completed wellness activities.
    </p>
  </div>

  <span className="text-sm font-semibold text-purple-700">
    {filteredActivities.length} completed
  </span>
</div>

<div className="flex gap-2 mb-5 flex-wrap">
  {["Today", "This Week", "All Time"].map((filter) => (
    <button
      key={filter}
      onClick={() => setActivityFilter(filter)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        activityFilter === filter
          ? "bg-purple-600 text-white"
          : "bg-purple-50 text-purple-700 hover:bg-purple-100"
      }`}
    >
      {filter}
    </button>
  ))}
</div>


  {filteredActivities.length === 0 ? (
    <p className="text-sm text-gray-500">
      No completed activities yet. Start with a small wellness activity!
    </p>
  ) : (
    <div className="space-y-3">
      {filteredActivities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌱</span>
            <div>
              <p className="font-medium text-gray-800">
                {activity.activity_title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Completed on {activity.activity_date}
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
            Completed
          </span>
        </div>
      ))}
    </div>
  )}
</div>







        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">

            <h3 className="text-lg font-semibold text-gray-800 mb-5">
              Mood Distribution
            </h3>

            {analytics.mood_distribution.length === 0 ? (
              <p className="text-gray-400 py-16 text-center">
                No mood data available yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.mood_distribution}
                    dataKey="count"
                    nameKey="mood"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {analytics.mood_distribution.map((entry, index) => (
                      <Cell
                        key={entry.mood}
                        fill={[
                          "#A855F7",
                          "#60A5FA",
                          "#F97316",
                          "#C084FC",
                          "#4ADE80",
                          "#F87171"
                        ][index % 6]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}

          </div>

          {/* Weekly Trend */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">

            <h3 className="text-lg font-semibold text-gray-800 mb-5">
              Weekly Mood Activity
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={analytics.weekly_trend.map(item => ({
                  ...item,
                  day: new Date(
                    item.date + "T00:00:00"
                  ).toLocaleDateString("en-US", {
                    weekday: "short"
                  })
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="day" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#9333EA"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>
          </div>
          
          {/* AI Mood Insights */}
<div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-purple-200">
  <div className="flex items-center justify-between mb-4">

  <div className="flex items-center gap-2">
    <span className="text-2xl">✨</span>

    <h3 className="text-lg font-semibold text-gray-800">
      AI Mood Insights
    </h3>

    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
      Gemini AI
    </span>
  </div>

  <button
    onClick={fetchMoodInsight}
    disabled={insightLoading}
    className="flex items-center gap-2 px-3 py-2 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <span className={insightLoading ? "animate-spin" : ""}>
      ↻
    </span>
    {insightLoading ? "Generating..." : "Refresh Insight"}
  </button>

</div>


  {insightLoading ? (
    <p className="text-gray-500 text-sm animate-pulse">
      Analyzing your recent mood entries...
    </p>
  ) : moodInsight ? (
    <p className="text-gray-700 text-sm leading-7 whitespace-pre-line">
      {moodInsight}
    </p>
  ) : (
    <p className="text-gray-500 text-sm">
      Record your moods to receive personalized insights.
    </p>
  )}

</div>

{/* Mood Insights History */}
<div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">

  <div className="flex items-center justify-between mb-5">
    <h3 className="text-lg font-semibold text-gray-800">
      📖 Previous Mood Insights
    </h3>

    <span className="text-xs text-gray-500">
      {insightHistory.length} insights
    </span>
  </div>

  {historyLoading ? (
    <p className="text-sm text-gray-500 animate-pulse">
      Loading your insight history...
    </p>
  ) : insightHistory.length === 0 ? (
    <p className="text-sm text-gray-500">
      No previous insights available yet.
    </p>
  ) : (
    <div className="space-y-4">

      {insightHistory.map((item) => (
        <div
          key={item.id}
          className="p-4 rounded-xl bg-purple-50 border border-purple-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-purple-700">
              ✨ AI Insight
            </span>

            <span className="text-xs text-gray-500">
              {new Date(item.created_at.replace(" ", "T") + "Z").toLocaleString()}
            </span>
          </div>

          <p className="text-sm text-gray-700 leading-6 whitespace-pre-line">
            {item.insight}
          </p>
        </div>
      ))}

    </div>
  )}

</div>

{/* Mood-Based Recommendations */}
<div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-purple-200">

  {/* Heading */}
  <div className="flex items-center justify-between mb-5">

    <div>
      <h3 className="text-lg font-semibold text-gray-800">
        🌿 Personalized Recommendations
      </h3>

      <p className="text-sm text-gray-500 mt-1">
        Small activities to support your well-being.
      </p>
    </div>

    <button
      onClick={fetchRecommendations}
      disabled={recommendationLoading}
      className="px-3 py-2 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg disabled:opacity-50"
    >
      {recommendationLoading ? "Loading..." : "↻ Refresh"}
    </button>

  </div>

  {/* Current Mood */}
  {recommendationMood && (
    <p className="text-sm text-gray-600 mb-4">
      Based on your latest recorded mood:{" "}
      <span className="font-semibold text-purple-700">
        {recommendationMood}
      </span>
    </p>
  )}

  {/* Recommendations */}
  {recommendationLoading ? (
    <p className="text-sm text-gray-500 animate-pulse">
      Finding helpful activities for you...
    </p>
  ) : recommendations.length === 0 ? (
    <p className="text-sm text-gray-500">
      Record your mood in Mood Tracker to receive personalized recommendations.
    </p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {recommendations.map((item, index) => (
        <div
          key={index}
          className="p-5 rounded-xl bg-purple-50 border border-purple-100 hover:shadow-md transition"
        >
          <div className="flex items-center gap-3 mb-3">

            <span className="text-3xl">
              {item.icon}
            </span>

            <h4 className="font-semibold text-gray-800">
              {item.title}
            </h4>

          </div>

          <p className="text-sm text-gray-600 leading-6">
            {item.description}
          </p>
          

{completedActivities.some(
  (activity) => activity.activity_title === item.title
) ? (
  <button
    disabled
    className="mt-3 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium"
  >
    ✓ Completed
  </button>
) : (
  <button
    onClick={() => handleCompleteActivity(item.title)}
    disabled={activityLoading === item.title}
    className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
  >
    {activityLoading === item.title
      ? "Saving..."
      : "Mark Complete"}
  </button>
)}


        </div>
      ))}

    </div>
  )}

  <p className="text-xs text-gray-400 mt-5">
    These are general wellness suggestions, not medical advice.
  </p>

</div>
          

       

      </>
    )}

  </section>
)}


{/* Chat History Page */}
{activePage === "Chat History" && (
  <section className="p-6 md:p-8 max-w-5xl mx-auto w-full">

    {/* Heading */}
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Your Chat History 💬
      </h2>
      <p className="text-gray-500 mt-2">
        Revisit your previous conversations with MindCare.
      </p>
    </div>

    <div className="relative mt-5 mb-6">
  <input
    type="text"
    value={chatSearch}
    onChange={(e) => setChatSearch(e.target.value)}
    placeholder="Search your conversations..."
    className="w-full p-3 pl-4 rounded-xl border border-gray-200
    focus:outline-none focus:ring-2 focus:ring-purple-400"
  />
</div>

{/* Date Filter */}
<div className="mb-5">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Filter by date
  </label>

  <input
    type="date"
    value={chatDate}
    onChange={(e) => setChatDate(e.target.value)}
    className="w-full p-3 rounded-xl border border-gray-200
    focus:outline-none focus:ring-2 focus:ring-purple-400"
  />

  {chatDate && (
    <button
      onClick={() => setChatDate("")}
      className="text-sm text-purple-600 hover:underline mt-2"
    >
      Clear date filter
    </button>
  )}
</div>

    {/* Loading */}
    {chatHistoryLoading && (
      <div className="text-center py-12 text-purple-600">
        Loading your conversations...
      </div>
    )}

    {/* Error */}
    {!chatHistoryLoading && chatHistoryError && (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl">
        {chatHistoryError}
        <button
          onClick={fetchChatHistory}
          className="ml-3 underline font-semibold"
        >
          Try again
        </button>
      </div>
    )}

    {/* Empty History */}
    {!chatHistoryLoading &&
      !chatHistoryError &&
      chatHistory.length === 0 && (
        <div className="bg-white rounded-xl p-10 text-center border border-gray-200">
          <p className="text-4xl mb-3">💜</p>
          <h3 className="font-semibold text-gray-800">
            No conversations yet
          </h3>
          <p className="text-gray-500 text-sm mt-2">
            Your conversations with MindCare will appear here.
          </p>
        </div>
      )}

    {/* Conversation List */}
    {!chatHistoryLoading &&
      !chatHistoryError &&
      chatHistory.length > 0 && (
        <div className="space-y-4">

          <p className="text-sm text-gray-500">
{filteredChatHistory.length} matching conversations
          </p>

    {filteredChatHistory.map((chat) => (           
      <div
              key={chat.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4"
            >

              {/* Timestamp */}
              <p className="text-xs text-gray-400">
             {formatTimestamp(chat.created_at)}
              </p>

              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-purple-600 text-white rounded-xl rounded-br-sm px-4 py-3 max-w-[85%]">
                  <p className="text-xs text-purple-100 mb-1">
                    You
                  </p>
                  <p className="text-sm">
                    {chat.user_message}
                  </p>
                </div>
              </div>

              {/* MindCare Reply */}
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-700 rounded-xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                  <p className="text-xs text-purple-600 font-semibold mb-1">
                    MindCare 💜
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {chat.bot_reply}
                  </p>
                </div>
              </div>

            </div>
          ))}

        </div>
      )}

  </section>
)}

      
        {activePage === "Mood Tracker" && (
  <section className="flex-1 p-6 md:p-8 max-w-5xl w-full mx-auto overflow-y-auto">

    {/* Heading */}
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800">
        How are you feeling today? 💜
      </h2>
      <p className="text-gray-500 mt-2">
        Track your emotions and understand your mental well-being.
      </p>
    </div>

    {/* Mood Selection */}
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

      <h3 className="text-lg font-semibold text-gray-800 mb-5">
        Select your current mood
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

        {moodOptions.map((mood) => (
          <button
            key={mood.name}
            onClick={() => setSelectedMood(mood.name)}
            className={`p-5 rounded-xl border-2 transition-all
              ${selectedMood === mood.name
                ? "border-purple-500 bg-purple-50"
                : "border-gray-100 hover:border-purple-300"
              }`}
          >
            <div className={`text-3xl mb-2 inline-flex p-3 rounded-full ${mood.color}`}>
              {mood.emoji}
            </div>

            <p className="font-medium text-gray-700">
              {mood.name}
            </p>
          </button>
        ))}

      </div>

      {/* Note */}
      <div className="mt-6">
        <label className="block text-gray-700 font-medium mb-2">
          Add a note (optional)
        </label>

        <textarea
          value={moodNote}
          onChange={(e) => setMoodNote(e.target.value)}
          placeholder="Why are you feeling this way?"
          rows={3}
          className="w-full border border-gray-200 rounded-xl p-4 outline-none focus:border-purple-400 resize-none"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleMoodSave}
        disabled={!selectedMood || moodLoading}
        className="mt-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl flex items-center gap-2"
      >
        {moodLoading ? (
          <>
            <LoaderCircle size={18} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Heart size={18} />
            Save My Mood
          </>
        )}
      </button>

      {moodError && (
        <p className="text-red-500 mt-4 text-sm">
          {moodError}
        </p>
      )}

      {moodSuccess && (
        <p className="text-green-600 mt-4 text-sm">
          {moodSuccess}
        </p>
      )}

    </div>

    {/* Mood History */}
    <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

      <div className="flex items-center gap-2 mb-5">
        <CalendarDays className="text-purple-600" />

        <h3 className="text-lg font-semibold text-gray-800">
          Your Mood History
        </h3>
      </div>

      {historyLoading ? (
        <p className="text-gray-500">Loading mood history...</p>
      ) : moodHistory.length === 0 ? (
        <p className="text-gray-500">
          No mood entries yet. Start tracking your mood today!
        </p>
      ) : (
        <div className="space-y-4">

          {moodHistory.map((item) => {

            const mood = moodOptions.find(
              (m) => m.name === item.mood
            );

            return (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-purple-50"
              >
                <div className="text-2xl">
                  {mood?.emoji || "💜"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">
                    {item.mood}
                  </p>

                  {item.note && (
                    <p className="text-sm text-gray-600 mt-1">
                      {item.note}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    {item.created_at
                      ? new Date(
                          item.created_at.replace(" ", "T") + "Z"
                        ).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })
                      : ""}
                  </p>
                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>

  </section>
)}


      </main>
    </div>
  );
}

export default App; 


