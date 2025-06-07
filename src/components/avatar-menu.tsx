"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserDetails } from "@/lib/firebase/db";
import { auth } from "@/lib/firebase/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AvatarMenu() {
  const router = useRouter();
  const [name, setName] = useState({ firstName: '', lastName: '' });

  useEffect(() => {
    const loadUserDetails = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const details = await getUserDetails(userId);
      if (details) {
        setName({ firstName: details.firstName, lastName: details.lastName });
      }
    };

    loadUserDetails();
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/login");
  };

  const initials = `${name.firstName.charAt(0)}${name.lastName.charAt(0)}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {name.lastName}, {name.firstName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
