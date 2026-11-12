import bcrypt from "bcryptjs";
import { db, Prisma, Role } from "@career-portal/database";
import { defaultFormConfig } from "./defaults/form-config.defaults";
import { siteConfigSeed } from "./defaults/site-config.seed";

const BOOTSTRAP_USER = "system_bootstrap";
const audit = { usercreate_at: BOOTSTRAP_USER, userupdated_at: BOOTSTRAP_USER, isdelete: false };

/**
 * Makes a freshly migrated database usable without running a seed: creates the default site
 * configuration, the default application form and — when INITIAL_ADMIN_PASSWORD is set and no
 * admin exists — the first admin account. Existing rows are never changed.
 */
export async function bootstrapDatabase(): Promise<void> {
  if (!(await db.site_configs.findFirst({ where: { code: siteConfigSeed.code } }))) {
    await db.site_configs.create({ data: { ...siteConfigSeed, ...audit } });
    console.log(`[bootstrap] default site configuration created`);
  }

  if (!(await db.form_configs.findFirst({ where: { code: defaultFormConfig.code } }))) {
    const { code, name, sections, submitLabel, successTitle, successBody } = defaultFormConfig;
    await db.form_configs.create({
      data: {
        code,
        name,
        sections: sections as unknown as Prisma.InputJsonValue,
        submitLabel: submitLabel as unknown as Prisma.InputJsonValue,
        successTitle: successTitle as unknown as Prisma.InputJsonValue,
        successBody: successBody as unknown as Prisma.InputJsonValue,
        ...audit,
      },
    });
    console.log(`[bootstrap] default application form created`);
  }

  if (await db.user.findFirst({ where: { role: Role.ADMIN } })) return;
  const password = process.env.INITIAL_ADMIN_PASSWORD ?? "";
  const email = (process.env.INITIAL_ADMIN_EMAIL || "admin@careerportal.com").trim().toLowerCase();
  if (password.length < 8) {
    console.warn(
      "[bootstrap] no admin account yet: set INITIAL_ADMIN_PASSWORD (min 8 characters) in the API env file and restart.",
    );
    return;
  }
  await db.user.create({
    data: {
      code: "USR-ROOT-001",
      email,
      passwordHash: await bcrypt.hash(password, 10),
      name: "Quản trị viên",
      role: Role.ADMIN,
      ...audit,
    },
  });
  console.log(`[bootstrap] first admin ${email} created; remove INITIAL_ADMIN_PASSWORD from the env file.`);
}
