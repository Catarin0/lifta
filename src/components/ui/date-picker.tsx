"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange: (date: string) => void
  label?: string
}

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const date = value ? new Date(value) : undefined

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <Label htmlFor="date" className="px-1">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            id="date"
            className={cn(
              "w-full justify-between font-normal",
              !date && "text-muted-foreground"
            )}
          >
            {date ? date.toLocaleDateString() : "Pick a date"}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(newDate) => {
              if (newDate) {
                // Ensure we use local timezone when converting to ISO string
                const year = newDate.getFullYear();
                const month = String(newDate.getMonth() + 1).padStart(2, '0');
                const day = String(newDate.getDate()).padStart(2, '0');
                const localDate = `${year}-${month}-${day}`;
                onChange(localDate);
                setOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
