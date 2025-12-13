import { useStore } from "@/lib/mock-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { menus } = useStore();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Weekly Menus</h1>
          <p className="text-muted-foreground mt-1">Plan your culinary journey for the week.</p>
        </div>
        <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4 mr-2" />
          New Menu
        </Button>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {menus.map((menu) => (
          <motion.div key={menu.id} variants={item}>
            <Card className="group hover:border-primary/50 transition-all hover:shadow-md cursor-pointer overflow-hidden border-l-4 border-l-primary/0 hover:border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant={menu.status === 'cooked' ? 'secondary' : 'default'} className="mb-2">
                    {menu.status}
                  </Badge>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">
                  {menu.title}
                </CardTitle>
                <CardDescription>{new Date(menu.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {menu.items.slice(0, 3).map((dish, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                      {dish}
                    </li>
                  ))}
                  {menu.items.length > 3 && (
                    <li className="text-xs text-muted-foreground pl-3.5">
                      +{menu.items.length - 3} more items
                    </li>
                  )}
                </ul>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        
        <motion.div variants={item}>
          <button className="w-full h-full min-h-[250px] border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all gap-4 group">
            <div className="h-12 w-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-medium">Create New Menu</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
