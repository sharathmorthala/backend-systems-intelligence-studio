import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle, Send } from "lucide-react";

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

export default function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<ContactForm>({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return await response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Message Sent", description: "Thank you for reaching out." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Send", description: error.message, variant: "destructive" });
    },
  });

  const validate = (): boolean => {
    const newErrors: Partial<ContactForm> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email format";
    if (!form.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      contactMutation.mutate(form);
    }
  };

  const handleReset = () => {
    setForm({ name: "", email: "", message: "" });
    setSubmitted(false);
    setErrors({});
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-page-title">Contact</h1>
            <p className="text-sm text-muted-foreground">Get in touch with questions or feedback</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send a Message</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-3 rounded-full bg-green-500/10 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2" data-testid="text-success-title">Message Sent</h3>
                  <p className="text-sm text-muted-foreground mb-4" data-testid="text-success-description">
                    Thank you for reaching out. I will respond as soon as possible.
                  </p>
                  <Button variant="outline" onClick={handleReset} data-testid="button-send-another">
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={contactMutation.isPending}
                      data-testid="input-name"
                    />
                    {errors.name && <p className="text-xs text-red-500" data-testid="error-name">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={contactMutation.isPending}
                      data-testid="input-email"
                    />
                    {errors.email && <p className="text-xs text-red-500" data-testid="error-email">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Your question or feedback..."
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      disabled={contactMutation.isPending}
                      className="resize-none"
                      data-testid="textarea-message"
                    />
                    {errors.message && <p className="text-xs text-red-500" data-testid="error-message">{errors.message}</p>}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={contactMutation.isPending}
                    data-testid="button-submit"
                  >
                    {contactMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" />Send Message</>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="border-t bg-muted/30 px-6 py-3">
        <p className="text-xs text-muted-foreground text-center">
          LLMs are used as assistants. Deterministic backend logic remains the source of truth.
        </p>
      </footer>
    </div>
  );
}
