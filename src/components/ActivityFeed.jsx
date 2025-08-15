import ActivityCard from "./ActivityCard";

export default function ActivityFeed({ activities }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Feed</h2>
        <p className="text-gray-600">
          Join your friends for amazing sports activities!
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏃‍♂️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No activities yet
          </h3>
          <p className="text-gray-600">
            Be the first to create a sports activity!
          </p>
        </div>
      ) : (
        activities.map((activity, index) => (
          <ActivityCard key={activity.id} activity={activity} index={index} />
        ))
      )}
    </div>
  );
}
