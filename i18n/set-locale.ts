"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isSupportedLocale } from "./config";

export async function setLocale(locale: string) {
  if (!isSupportedLocale(locale)) {
    return;
  }

  const store = await cookies();
  store.set("locale", locale);
  revalidatePath("/");
}
