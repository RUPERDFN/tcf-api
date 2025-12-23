import { useStore } from "@/lib/mock-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, CreditCard, Bell } from "lucide-react";

export default function Profile() {
  const { user } = useStore();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-serif font-bold">Chef Profile</h1>
      
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/80 to-secondary/80" />
        <CardHeader className="relative pt-0 pb-8">
          <div className="absolute -top-16 left-8">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.email}`} />
              <AvatarFallback className="text-4xl">{user.email[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-44 mt-4">
            <CardTitle className="text-2xl font-bold">{user.name || "Chef"}</CardTitle>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Settings className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Preferences</h3>
                <p className="text-sm text-muted-foreground">Dietary restrictions, units, and themes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Subscription</h3>
                <p className="text-sm text-muted-foreground">Manage your Pro membership</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">Email digests and shopping reminders</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
