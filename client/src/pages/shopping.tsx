import { useState } from "react";
import { useStore } from "@/lib/mock-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ShoppingList() {
  const { shoppingList, addItem, toggleItem } = useStore();
  const [newItem, setNewItem] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      addItem(newItem);
      setNewItem("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold">Shopping List</h1>
          <p className="text-muted-foreground">Don't forget the essentials.</p>
        </div>
      </div>

      <Card className="border-t-4 border-t-primary shadow-lg">
        <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
          <form onSubmit={handleAdd} className="flex gap-4">
            <Input 
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add an item (e.g., 'Fresh Basil')"
              className="h-12 text-lg bg-background border-muted-foreground/20 focus-visible:ring-primary/20"
              data-testid="input-shopping-item"
            />
            <Button type="submit" size="lg" className="h-12 px-6" disabled={!newItem.trim()}>
              <Plus className="h-5 w-5" />
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            <AnimatePresence initial={false}>
              {shoppingList.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-center p-4 gap-4 hover:bg-muted/20 transition-colors ${item.checked ? 'bg-muted/10' : ''}`}
                >
                  <Checkbox 
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="h-6 w-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    data-testid={`checkbox-item-${item.id}`}
                  />
                  <div className="flex-1">
                    <span className={`text-lg transition-all ${item.checked ? 'text-muted-foreground line-through decoration-2 decoration-muted-foreground/30' : 'text-foreground font-medium'}`}>
                      {item.name}
                    </span>
                    {item.category && (
                      <span className="ml-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground/60 border border-border px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {shoppingList.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Your list is empty. Time to plan a feast!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
