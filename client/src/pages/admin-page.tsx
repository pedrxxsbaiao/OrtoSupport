import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CreateUserRequest, 
  GetUsersResponse, 
  UserResponse, 
  DeleteUserResponse,
  CreateSuggestionRequest,
  GetSuggestionsResponse,
  Suggestion,
  UpdateSuggestionRequest
} from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  AlertTriangle,
  Loader2, 
  MessageSquarePlus, 
  Pencil, 
  Plus, 
  Trash2, 
  UserPlus 
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const suggestionSchema = z.object({
  text: z.string().min(3, {
    message: "A sugestão deve ter pelo menos 3 caracteres.",
  }),
  category: z.string().optional(),
  active: z.boolean().default(true),
});

export default function AdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("usuarios");
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  
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
  
  // Buscar lista de sugestões
  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery<GetSuggestionsResponse>({
    queryKey: ["/api/suggestions"],
    enabled: !!user && activeTab === "sugestoes",
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
      userForm.reset({
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
  
  // Mutation para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      return await res.json() as DeleteUserResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Usuário excluído",
          description: "O usuário foi excluído com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      } else {
        toast({
          title: "Erro ao excluir usuário",
          description: "Não foi possível excluir o usuário. Tente novamente.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para criar sugestão
  const createSuggestionMutation = useMutation({
    mutationFn: async (suggestionData: CreateSuggestionRequest) => {
      const res = await apiRequest("POST", "/api/suggestions", suggestionData);
      return await res.json() as Suggestion;
    },
    onSuccess: () => {
      toast({
        title: "Sugestão criada",
        description: "A sugestão foi criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      suggestionForm.reset({
        text: "",
        category: "",
        active: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar sugestão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para atualizar sugestão
  const updateSuggestionMutation = useMutation({
    mutationFn: async (data: UpdateSuggestionRequest) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PUT", `/api/suggestions/${id}`, rest);
      return await res.json() as Suggestion;
    },
    onSuccess: () => {
      toast({
        title: "Sugestão atualizada",
        description: "A sugestão foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      setEditingSuggestion(null);
      suggestionForm.reset({
        text: "",
        category: "",
        active: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar sugestão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para excluir sugestão
  const deleteSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: number) => {
      const res = await apiRequest("DELETE", `/api/suggestions/${suggestionId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sugestão excluída",
        description: "A sugestão foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir sugestão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form de usuário
  const userForm = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      role: "user",
    },
  });
  
  // Form de sugestão
  const suggestionForm = useForm<z.infer<typeof suggestionSchema>>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      text: "",
      category: "",
      active: true,
    },
  });
  
  // Atualizar form quando estiver editando
  useEffect(() => {
    if (editingSuggestion) {
      suggestionForm.reset({
        text: editingSuggestion.text,
        category: editingSuggestion.category || "",
        active: editingSuggestion.active,
      });
    }
  }, [editingSuggestion, suggestionForm]);

  function onSubmitUser(values: z.infer<typeof createUserSchema>) {
    createUserMutation.mutate(values as CreateUserRequest);
  }
  
  function onSubmitSuggestion(values: z.infer<typeof suggestionSchema>) {
    if (editingSuggestion) {
      updateSuggestionMutation.mutate({ 
        id: editingSuggestion.id, 
        ...values 
      });
    } else {
      createSuggestionMutation.mutate(values);
    }
  }

  if (!user || user.role !== "master") {
    return null;
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
          <p className="text-muted-foreground">Gerencie usuários e configurações do sistema</p>
        </div>
        <Button onClick={() => navigate("/")}>Voltar para o Assistente</Button>
      </div>
      
      <Tabs defaultValue="usuarios" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="sugestoes">Sugestões</TabsTrigger>
        </TabsList>
        
        {/* Seção de Usuários */}
        <TabsContent value="usuarios">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Formulário de criação de usuário */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Criar novo usuário</CardTitle>
                <CardDescription>
                  Preencha os dados para adicionar um novo usuário ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
                    <FormField
                      control={userForm.control}
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
                      control={userForm.control}
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
                      control={userForm.control}
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
                      control={userForm.control}
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
                      control={userForm.control}
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
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users && users.length > 0 ? (
                        users.map((userData) => (
                          <TableRow key={userData.id}>
                            <TableCell className="font-medium">{userData.name}</TableCell>
                            <TableCell>{userData.username}</TableCell>
                            <TableCell>{userData.email}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                                ${userData.role === 'master' 
                                  ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                                  : 'bg-gray-50 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                                {userData.role === 'master' ? 'Administrador' : 'Usuário'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {userData.id !== user?.id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Excluir
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Você tem certeza que deseja excluir o usuário <strong>{userData.name}</strong>?
                                        <br />
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteUserMutation.mutate(userData.id)}>
                                        {deleteUserMutation.isPending ? 
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
                                          <Trash2 className="h-4 w-4 mr-2" />}
                                        Confirmar exclusão
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
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
        </TabsContent>
        
        {/* Seção de Sugestões */}
        <TabsContent value="sugestoes">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Formulário de criação/edição de sugestão */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>{editingSuggestion ? 'Editar sugestão' : 'Criar nova sugestão'}</CardTitle>
                <CardDescription>
                  {editingSuggestion 
                    ? 'Edite os dados da sugestão selecionada' 
                    : 'Adicione uma sugestão para exibir aos usuários'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...suggestionForm}>
                  <form onSubmit={suggestionForm.handleSubmit(onSubmitSuggestion)} className="space-y-4">
                    <FormField
                      control={suggestionForm.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Texto da sugestão</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Digite a sugestão que será exibida aos usuários..." 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={suggestionForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Aparatologia, Diagnóstico, Tratamento..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={suggestionForm.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Ativa</FormLabel>
                            <FormDescription>
                              Sugestões ativas serão exibidas aos usuários
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={createSuggestionMutation.isPending || updateSuggestionMutation.isPending}
                      >
                        {(createSuggestionMutation.isPending || updateSuggestionMutation.isPending) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingSuggestion ? 'Atualizando...' : 'Criando...'}
                          </>
                        ) : (
                          <>
                            {editingSuggestion ? (
                              <>
                                <Pencil className="mr-2 h-4 w-4" />
                                Atualizar
                              </>
                            ) : (
                              <>
                                <MessageSquarePlus className="mr-2 h-4 w-4" />
                                Criar sugestão
                              </>
                            )}
                          </>
                        )}
                      </Button>
                      {editingSuggestion && (
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setEditingSuggestion(null);
                            suggestionForm.reset({
                              text: "",
                              category: "",
                              active: true,
                            });
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Lista de sugestões */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Sugestões configuradas</CardTitle>
                <CardDescription>
                  Sugestões que serão exibidas para os usuários no assistente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSuggestions ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sugestão</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suggestions && suggestions.length > 0 ? (
                        suggestions.map((suggestion) => (
                          <TableRow key={suggestion.id}>
                            <TableCell className="font-medium max-w-[300px] truncate">
                              {suggestion.text}
                            </TableCell>
                            <TableCell>{suggestion.category || "-"}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                                ${suggestion.active 
                                  ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {suggestion.active ? 'Ativa' : 'Inativa'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingSuggestion(suggestion)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Você tem certeza que deseja excluir esta sugestão?
                                        <br />
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteSuggestionMutation.mutate(suggestion.id)}>
                                        {deleteSuggestionMutation.isPending ? 
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
                                          <Trash2 className="h-4 w-4 mr-2" />}
                                        Confirmar exclusão
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                            Nenhuma sugestão encontrada. Crie a primeira!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}