// src/components/ActivityInvitations.jsx
import { useState, useEffect, useCallback } from "react";
import { Check, X, Calendar, MapPin, Users } from "lucide-react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import {
  getUserInvitations,
  respondToInvitation,
} from "../api/activityInvitations";

export default function ActivityInvitations() {
  const { user } = useSupabaseAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState({});

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserInvitations(user.id);
      setInvitations(data);
    } catch (error) {
      console.error("Failed to load invitations:", error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user?.id) {
      loadInvitations();
    }
  }, [user?.id, loadInvitations]);

  const handleResponse = async (invitationId, response) => {
    setResponding((prev) => ({ ...prev, [invitationId]: true }));
    try {
      await respondToInvitation(invitationId, response, user.id);
      // Remove the invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      console.error("Failed to respond to invitation:", error);
    } finally {
      setResponding((prev) => ({ ...prev, [invitationId]: false }));
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-gray-100">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No Pending Invitations
          </h3>
          <p className="text-gray-600 text-sm">
            When friends invite you to activities, they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Activity Invitations
        </h2>
        <span className="text-sm text-gray-500">
          {invitations.length} pending
        </span>
      </div>

      <div className="space-y-4">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
          >
            {/* Header with inviter */}
            <div className="flex items-center gap-3 mb-4">
              {invitation.inviter?.avatar_url ? (
                <img
                  src={invitation.inviter.avatar_url}
                  alt={invitation.inviter.display_name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {getInitials(invitation.inviter?.display_name)}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {invitation.inviter?.display_name || "Someone"} invited you
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(invitation.created_at)}
                </p>
              </div>
            </div>

            {/* Activity details */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-gray-900 mb-2">
                {invitation.activity?.title}
              </h3>

              <div className="space-y-2 text-sm text-gray-600">
                {invitation.activity?.starts_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>{formatDate(invitation.activity.starts_at)}</span>
                  </div>
                )}

                {invitation.activity?.place_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>{invitation.activity.place_name}</span>
                  </div>
                )}

                {invitation.activity?.description && (
                  <p className="text-gray-700 mt-2">
                    {invitation.activity.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleResponse(invitation.id, "accepted")}
                disabled={responding[invitation.id]}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {responding[invitation.id] ? "Accepting..." : "Accept"}
              </button>

              <button
                onClick={() => handleResponse(invitation.id, "declined")}
                disabled={responding[invitation.id]}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:transform-none flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                {responding[invitation.id] ? "Declining..." : "Decline"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
