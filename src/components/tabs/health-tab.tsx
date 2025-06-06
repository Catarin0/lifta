"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/auth";
import { updateHealthData, getHealthData, type HealthData } from "@/lib/firebase/db";

export function HealthTab() {
  const [data, setData] = useState<HealthData>({
    dailySteps: 0,
    heartRate: 0,
    sleepHours: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const healthData = await getHealthData(userId);
        if (healthData) {
          setData(healthData);
        }
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setIsSaving(true);
    try {
      await updateHealthData(userId, data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving health data:", error);
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Health Overview</h2>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>
        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Daily Steps</div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={data.dailySteps}
                    onChange={(e) => setData({ ...data, dailySteps: Number(e.target.value) })}
                    className="mt-2"
                  />
                ) : (
                  <div className="text-2xl font-bold">{data.dailySteps} steps</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Heart Rate</div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={data.heartRate}
                    onChange={(e) => setData({ ...data, heartRate: Number(e.target.value) })}
                    className="mt-2"
                  />
                ) : (
                  <div className="text-2xl font-bold">{data.heartRate} bpm</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Sleep Hours</div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={data.sleepHours}
                    onChange={(e) => setData({ ...data, sleepHours: Number(e.target.value) })}
                    className="mt-2"
                  />
                ) : (
                  <div className="text-2xl font-bold">{data.sleepHours}h</div>
                )}
              </CardContent>
            </Card>
          </div>
          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
