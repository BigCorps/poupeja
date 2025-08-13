import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useEffect, useState } from 'react';
import { Card, Tabs, TabsContent, TabsList, TabsTrigger, Input, Select, Button } from '../components/ui';
import { useCadastros } from '../hooks/useCadastros';
import { PaymentMethod, Supplier, Category } from '../types/cadastros';

export function CadastroPage() {
  const [activeTab, setActiveTab] = useState('payment-methods');
  const { 
    paymentMethods,
    suppliers,
    categories,
    addPaymentMethod,
    addSupplier,
    addCategory,
    deletePaymentMethod,
    deleteSupplier,
    deleteCategory
  } = useCadastros();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cadastros</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payment-methods">
            Formas de Pagamento
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            Fornecedores/Clientes
          </TabsTrigger>
          <TabsTrigger value="categories">
            Categorias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment-methods">
          <Card className="p-6">
            <PaymentMethodsSection 
              methods={paymentMethods}
              onAdd={addPaymentMethod}
              onDelete={deletePaymentMethod}
            />
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card className="p-6">
            <SuppliersSection 
              suppliers={suppliers}
              onAdd={addSupplier}
              onDelete={deleteSupplier}
            />
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="p-6">
            <CategoriesSection 
              categories={categories}
              onAdd={addCategory}
              onDelete={deleteCategory}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentMethodsSection({ methods, onAdd, onDelete }) {
  const [newMethod, setNewMethod] = useState<PaymentMethod>({
    name: '',
    type: 'both'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newMethod);
    setNewMethod({ name: '', type: 'both' });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nome"
            value={newMethod.name}
            onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
          />
          <Select
            label="Tipo"
            value={newMethod.type}
            onValueChange={(value) => setNewMethod({ ...newMethod, type: value })}
            options={[
              { value: 'payment', label: 'Pagamento' },
              { value: 'receipt', label: 'Recebimento' },
              { value: 'both', label: 'Ambos' }
            ]}
          />
        </div>
        <Button type="submit">Adicionar</Button>
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Formas de Pagamento Cadastradas</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((method) => (
              <tr key={method.id}>
                <td>{method.name}</td>
                <td>{method.type}</td>
                <td>
                  <Button variant="ghost" onClick={() => onDelete(method.id)}>
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SuppliersSection({ suppliers, onAdd, onDelete }) {
  const [newSupplier, setNewSupplier] = useState<Supplier>({
    name: '',
    type: 'both',
    document: '',
    email: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newSupplier);
    setNewSupplier({
      name: '',
      type: 'both',
      document: '',
      email: '',
      phone: ''
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nome"
            value={newSupplier.name}
            onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
          />
          <Select
            label="Tipo"
            value={newSupplier.type}
            onValueChange={(value) => setNewSupplier({ ...newSupplier, type: value })}
            options={[
              { value: 'supplier', label: 'Fornecedor' },
              { value: 'client', label: 'Cliente' },
              { value: 'both', label: 'Ambos' }
            ]}
          />
          <Input
            label="Documento (CPF/CNPJ)"
            value={newSupplier.document}
            onChange={(e) => setNewSupplier({ ...newSupplier, document: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={newSupplier.email}
            onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
          />
          <Input
            label="Telefone"
            value={newSupplier.phone}
            onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
          />
        </div>
        <Button type="submit">Adicionar</Button>
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Fornecedores/Clientes Cadastrados</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Documento</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.type}</td>
                <td>{supplier.document}</td>
                <td>{supplier.email}</td>
                <td>{supplier.phone}</td>
                <td>
                  <Button variant="ghost" onClick={() => onDelete(supplier.id)}>
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesSection({ categories, onAdd, onDelete }) {
  const [newCategory, setNewCategory] = useState<Category>({
    name: '',
    type: 'expense',
    color: '#9E9E9E',
    parent_id: null
  });

  const parentCategories = categories.filter(c => !c.parent_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newCategory);
    setNewCategory({
      name: '',
      type: 'expense',
      color: '#9E9E9E',
      parent_id: null
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nome"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
          />
          <Select
            label="Tipo"
            value={newCategory.type}
            onValueChange={(value) => setNewCategory({ ...newCategory, type: value })}
            options={[
              { value: 'income', label: 'Receita' },
              { value: 'expense', label: 'Despesa' }
            ]}
          />
          <Input
            label="Cor"
            type="color"
            value={newCategory.color}
            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
          />
          <Select
            label="Categoria Pai"
            value={newCategory.parent_id || ''}
            onValueChange={(value) => setNewCategory({ ...newCategory, parent_id: value || null })}
            options={[
              { value: '', label: 'Nenhuma' },
              ...parentCategories.map(cat => ({
                value: cat.id,
                label: cat.name
              }))
            ]}
          />
        </div>
        <Button type="submit">Adicionar</Button>
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Categorias Cadastradas</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Cor</th>
              <th>Categoria Pai</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.type}</td>
                <td>
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                </td>
                <td>
                  {parentCategories.find(p => p.id === category.parent_id)?.name}
                </td>
                <td>
                  <Button variant="ghost" onClick={() => onDelete(category.id)}>
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
