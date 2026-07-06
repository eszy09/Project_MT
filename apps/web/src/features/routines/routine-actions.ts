"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth";
import {
  archiveRoutine,
  createRoutine,
  deleteRoutine,
  updateRoutine,
  type RoutineInput,
} from "@/services";

export async function saveRoutineAction(input: {
  id?: string;
  version?: number;
  routine: RoutineInput;
}) {
  await requireSession("/routines");
  try {
    const routine =
      input.id && input.version
        ? await updateRoutine(input.id, input.version, input.routine)
        : await createRoutine(input.routine);
    revalidatePath("/routines");
    return { success: true as const, routine };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Routine could not be saved.",
    };
  }
}

export async function changeRoutineStateAction(
  id: string,
  version: number,
  operation: "archive" | "restore" | "delete",
) {
  await requireSession("/routines");
  try {
    if (operation === "delete") await deleteRoutine(id);
    else await archiveRoutine(id, version, operation === "restore");
    revalidatePath("/routines");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Routine could not be changed.",
    };
  }
}
