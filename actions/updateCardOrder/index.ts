'use server'

import { auth } from "@clerk/nextjs"
import { InputType, ReturnType } from "./types"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { CreateSafeAction } from "@/lib/create-safe-action"
import { UpdateCardOrder } from "./schema"

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = auth()

  if (!userId || !orgId) {
    return {
      error: "You must be logged in"
    }
  }

  const { items, boardId } = data
  let cards

  try {
    const transaction = items.map((card) =>
      db.card.update({
        where: { id: card.id, list: { board: { orgId } } },
        data: { order: card.order, listId: card.listId }
      })
    )

    cards = await db.$transaction(transaction)
  } catch (error) {
    return {
      error: "Failed to reorder"
    }
  }

  revalidatePath(`/board/${boardId}`)
  return { data: cards }
}

export const updateCardOrder = CreateSafeAction(UpdateCardOrder, handler)