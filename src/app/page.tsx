"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FinanceTab } from "@/components/tabs/finance-tab";
import { auth, getCurrentUser } from "@/lib/firebase/auth";
import { AvatarMenu } from "@/components/avatar-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { onAuthStateChanged } from "firebase/auth";
import { getUserDetails } from "@/lib/firebase/db";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(getCurrentUser());
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // Load user details to get first name
        getUserDetails(user.uid).then(details => {
          if (details) {
            setFirstName(details.firstName);
          }
        });
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {firstName}</p>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <AvatarMenu />
          </div>
        </div>
        
        <div className="w-full">
          <FinanceTab />
        </div>
      </div>
    </div>
  );
}
