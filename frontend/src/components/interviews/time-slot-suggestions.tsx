"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Clock, Users, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflicts: string[];
}

interface TimeSlotSuggestionsProps {
  slots: TimeSlot[];
  isLoading: boolean;
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot;
}

export function TimeSlotSuggestions({
  slots,
  isLoading,
  onSlotSelect,
  selectedSlot,
}: TimeSlotSuggestionsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Créneaux suggérés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" text="Recherche des créneaux disponibles..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (slots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Créneaux suggérés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun créneau trouvé pour cette date</p>
            <p className="text-sm">Essayez une autre date ou réduisez la durée</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableSlots = slots.filter(slot => slot.available);
  const conflictSlots = slots.filter(slot => !slot.available);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Créneaux suggérés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Créneaux disponibles */}
        {availableSlots.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-green-700 mb-2">
              Créneaux disponibles ({availableSlots.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {availableSlots.map((slot, index) => (
                <SlotButton
                  key={index}
                  slot={slot}
                  onSelect={() => onSlotSelect(slot)}
                  isSelected={selectedSlot === slot}
                  variant="available"
                />
              ))}
            </div>
          </div>
        )}

        {/* Créneaux avec conflits */}
        {conflictSlots.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-orange-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Créneaux avec conflits ({conflictSlots.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {conflictSlots.slice(0, 4).map((slot, index) => (
                <SlotButton
                  key={index}
                  slot={slot}
                  onSelect={() => onSlotSelect(slot)}
                  isSelected={selectedSlot === slot}
                  variant="conflict"
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SlotButtonProps {
  slot: TimeSlot;
  onSelect: () => void;
  isSelected: boolean;
  variant: 'available' | 'conflict';
}

function SlotButton({ slot, onSelect, isSelected, variant }: SlotButtonProps) {
  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      onClick={onSelect}
      className={`
        flex flex-col items-start p-3 h-auto
        ${variant === 'available'
          ? 'border-green-200 hover:border-green-300'
          : 'border-orange-200 hover:border-orange-300'
        }
        ${isSelected ? 'ring-2 ring-blue-400' : ''}
      `}
    >
      <div className="flex items-center gap-2 w-full">
        <Clock className="h-3 w-3" />
        <span className="font-medium text-xs">
          {format(slot.start, 'HH:mm', { locale: fr })} - {format(slot.end, 'HH:mm', { locale: fr })}
        </span>
      </div>

      {variant === 'available' ? (
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          Libre
        </Badge>
      ) : (
        <div className="flex items-center gap-1 mt-1">
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
            {slot.conflicts.length} conflit{slot.conflicts.length > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {slot.conflicts.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1 text-left">
          {slot.conflicts.slice(0, 2).join(', ')}
          {slot.conflicts.length > 2 && ` +${slot.conflicts.length - 2}`}
        </div>
      )}
    </Button>
  );
}