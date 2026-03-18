"use client";

import { AppShell } from "@/components/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader title="Profile" subtitle="Account overview" />
          <CardBody>
            <p className="text-sm text-gray-600">
              Profile settings can be extended here.
            </p>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
