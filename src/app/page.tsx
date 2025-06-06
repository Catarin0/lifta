import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Hello World!</CardTitle>
          <CardDescription>Welcome to my application</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is a simple page built with Next.js and shadcn/ui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
