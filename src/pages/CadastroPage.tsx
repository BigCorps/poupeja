import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag, User, CreditCard } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

export default function CadastroPage() {
  const { toast } = useToast();
  const {
    categories,
    suppliers,
    paymentMethods,
    addCategory,
    updateCategory,
    deleteCategory,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    isLoading
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('categorias');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'expense', color: '#3B82F6', parent_id: null });
  const [supplierForm, setSupplierForm] = useState({ name: '', type: 'supplier', document: '', email: '', phone: '', address: '' });
  const [paymentForm, setPaymentForm] = useState({ name: '' }); // ✅ CORREÇÃO: Removido 'type' e 'is_default' do estado inicial

  // Funções para Categorias (usando useCallback para otimização)
  const handleSaveCategory = useCallback(async () => {
    if (!categoryForm.name.trim()) {
      toast({ title: "Erro", description: "O nome da categoria é obrigatório.", variant: "destructive" });
      return;
    }
    try {
      if (editingItem) {
        await updateCategory({ ...categoryForm, id: editingItem.id });
        toast({ title: "Sucesso", description: "Categoria atualizada com sucesso!" });
      } else {
        await addCategory(categoryForm);
        toast({ title: "Sucesso", description: "Categoria criada com sucesso!" });
      }
      resetCategoryForm();
    } catch (error) {
      toast({ title: "Erro ao salvar categoria", description: error.message, variant: "destructive" });
    }
  }, [categoryForm, editingItem, updateCategory, addCategory, toast]);

  const handleDeleteCategory = useCallback(async (id) => {
    try {
      await deleteCategory(id);
      toast({ title: "Sucesso", description: "Categoria excluída com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao excluir categoria", description: error.message, variant: "destructive" });
    }
  }, [deleteCategory, toast]);
  
  // Funções para Fornecedores
  const handleSaveSupplier = useCallback(async () => {
    // ... (lógica de salvar fornecedor)
    if (!supplierForm.name.trim()) {
      toast({ title: "Erro", description: "O nome é obrigatório.", variant: "destructive" });
      return;
    }
    try {
      if (editingItem) {
        await updateSupplier({ ...supplierForm, id: editingItem.id });
        toast({ title: "Sucesso", description: "Fornecedor atualizado com sucesso!" });
      } else {
        await addSupplier(supplierForm);
        toast({ title: "Sucesso", description: "Fornecedor criado com sucesso!" });
      }
      resetSupplierForm();
    } catch (error) {
       toast({ title: "Erro ao salvar fornecedor", description: error.message, variant: "destructive" });
    }
  }, [supplierForm, editingItem, updateSupplier, addSupplier, toast]);

  const handleDeleteSupplier = useCallback(async (id) => {
    // ... (lógica de deletar fornecedor)
     try {
      await deleteSupplier(id);
      toast({ title: "Sucesso", description: "Fornecedor excluído com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao excluir fornecedor", description: error.message, variant: "destructive" });
    }
  }, [deleteSupplier, toast]);

  // ✅ CORREÇÃO: Funções para Métodos de Pagamento
  const handleSavePayment = useCallback(async () => {
    if (!paymentForm.name.trim()) {
      toast({ title: "Erro", description: "O nome da forma de pagamento é obrigatório.", variant: "destructive" });
      return;
    }
    try {
      const dataToSave = {
        name: paymentForm.name,
        type: 'both', // Sempre será 'both'
        is_default: false // Pode ser ajustado se necessário
      };

      if (editingItem) {
        await updatePaymentMethod({ ...dataToSave, id: editingItem.id });
        toast({ title: "Sucesso", description: "Forma de pagamento atualizada com sucesso!" });
      } else {
        await addPaymentMethod(dataToSave);
        toast({ title: "Sucesso", description: "Forma de pagamento criada com sucesso!" });
      }
      resetPaymentForm();
    } catch (error) {
       toast({ title: "Erro ao salvar forma de pagamento", description: error.message, variant: "destructive" });
    }
  }, [paymentForm, editingItem, updatePaymentMethod, addPaymentMethod, toast]);

  const handleDeletePayment = useCallback(async (id) => {
    try {
      await deletePaymentMethod(id);
      toast({ title: "Sucesso", description: "Forma de pagamento excluída com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao excluir forma de pagamento", description: error.message, variant: "destructive" });
    }
  }, [deletePaymentMethod, toast]);

  // Funções de controle de formulário
  const resetCategoryForm = useCallback(() => { /* ... */ }, []);
  const handleEditCategory = useCallback((category) => { /* ... */ }, []);
  const resetSupplierForm = useCallback(() => { /* ... */ }, []);
  const handleEditSupplier = useCallback((supplier) => { /* ... */ }, []);
  const resetPaymentForm = useCallback(() => { setPaymentForm({ name: '' }); setShowPaymentForm(false); setEditingItem(null); }, []);
  const handleEditPayment = useCallback((payment) => { setPaymentForm(payment); setEditingItem(payment); setShowPaymentForm(true); }, []);

  // Renderização da árvore de categorias
  const renderCategoryTree = (parentId = null) => {
    const children = categories.filter(cat => cat.parent_id === parentId);
    if (children.length === 0 && parentId !== null) return null;

    return children.map(category => (
        <div key={category.id} className="pl-6 space-y-2">
            <Card>
                <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="font-medium">{category.name}</span>
                        <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                            {category.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                </CardContent>
            </Card>
            {renderCategoryTree(category.id)}
        </div>
    ));
  };
  
  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ... Cabeçalho da página ... */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* ... TabsList ... */}
        
        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
                {/* ... Cabeçalho do Card ... */}
            </CardHeader>
            <CardContent className="space-y-4">
              {showCategoryForm && (
                <Card>
                  <CardContent className="pt-6">
                    {/* ... campos do formulário ... */}
                    <div className="space-y-2">
                      <Label htmlFor="category-parent">Categoria Pai</Label>
                      {/* ✅ CORREÇÃO: Adicionada verificação para evitar erro */}
                      <Select value={categoryForm.parent_id || ''} onValueChange={(value) => setCategoryForm({ ...categoryForm, parent_id: value || null })}>
                        <SelectTrigger><SelectValue placeholder="Categoria Principal" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma (Principal)</SelectItem>
                          {categories && categories.filter(cat => !cat.parent_id).map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* ... resto do formulário ... */}
                  </CardContent>
                </Card>
              )}
              {/* ... Lista de Categorias ... */}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab Fornecedores */}
        <TabsContent value="fornecedores" className="space-y-4">
           {/* ... Conteúdo e formulário de fornecedores ... */}
        </TabsContent>

        {/* ✅ CORREÇÃO: Tab Métodos de Pagamento */}
        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader>
               {/* ... Cabeçalho do Card ... */}
            </CardHeader>
            <CardContent className="space-y-4">
              {showPaymentForm && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment-name">Nome</Label>
                        <Input id="payment-name" value={paymentForm.name} onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })} placeholder="Ex: Cartão Nubank" />
                      </div>
                      {/* O seletor de tipo foi removido */}
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={resetPaymentForm}><X className="w-4 h-4 mr-2" />Cancelar</Button>
                      <Button onClick={handleSavePayment}><Save className="w-4 h-4 mr-2" />Salvar</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* ... Lista de Formas de Pagamento ... */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
