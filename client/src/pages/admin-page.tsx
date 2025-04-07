import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreateUserRequest, GetUsersResponse, UserResponse } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const createUserSchema = z.object({
  username: z.string().min(3, {
    message: "O nome de usuário deve ter pelo menos 3 caracteres.",
  }),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres.",
  }),
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  role: z.enum(["user", "master"], {
    message: "Papel deve ser 'user' ou 'master'",
  }),
});

export default function AdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  // Verifica se o usuário é um master
  useEffect(() => {
    if (user && user.role !== "master") {
      navigate("/");
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar o painel de administração.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);

  // Buscar lista de usuários
  const { data: users, isLoading: isLoadingUsers } = useQuery<GetUsersResponse>({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === "master",
  });

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserRequest) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return await res.json() as UserResponse;
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      form.reset({
        username: "",
        password: "",
        name: "",
        email: "",
        role: "user",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form
  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      role: "user",
    },
  });

  function onSubmit(values: z.infer<typeof createUserSchema>) {
    createUserMutation.mutate(values as CreateUserRequest);
  }

  if (!user || user.role !== "master") {
    return null;
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
          <p className="text-muted-foreground">Gerencie usuários e acesso ao sistema</p>
        </div>
        <Button onClick={() => navigate("/")}>Voltar para o Assistente</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulário de criação */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Criar novo usuário</CardTitle>
            <CardDescription>
              Preencha os dados para adicionar um novo usuário ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="usuario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input placeholder="******" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de usuário</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">Usuário regular</SelectItem>
                          <SelectItem value="master">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Criar usuário
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Lista de usuários */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Usuários do sistema</CardTitle>
            <CardDescription>
              Todos os usuários registrados na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                            ${user.role === 'master' 
                              ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                              : 'bg-gray-50 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                            {user.role === 'master' ? 'Administrador' : 'Usuário'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}