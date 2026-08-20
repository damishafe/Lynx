"use server";

import { redirect } from "next/navigation";

import { setSession } from "@/lib/auth";
import { createUser, getUserByEmail, isDuplicateKeyError } from "@/lib/users";
import { seedDemoData } from "@/lib/seed";

const DEMO_EMAIL = "demo@lynx.local";
const DEMO_NAME = "Demo Operator";
const DEMO_PASSWORD = "Lynx-demo-2026";

export async function launchDemo() {
  let user = await getUserByEmail(DEMO_EMAIL);

  if (!user) {
    try {
      user = await createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        name: DEMO_NAME,
      });
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      user = await getUserByEmail(DEMO_EMAIL);
      if (!user) throw err;
    }
  }

  await seedDemoData(user._id);
  await setSession({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  });

  redirect("/dashboard");
}
