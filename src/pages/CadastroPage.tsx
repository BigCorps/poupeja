import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag, User, CreditCard } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useSuppliers } from '../hooks/useSuppliers';
import { usePaymentMethods } from '../hooks/usePaymentMethods';

const PAYMENT_METHODS_OPTIONS = [
  'PIX', 'BOLETO', 'CARTÃO DE CRÉDITO', 'CARTÃO DE DÉBITO', 'DINHEIRO',
  'TRANSFERÊNCIA', 'CHEQUE', 'REDE CARD', 'SITE', 'SHOPEE', 'MERCADOPAGO', 'DÉBITO EM CONTA'
];

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

export default function CadastrosSection() {
  const [activeTab, setActiveTab] = useState('categorias');
  
  // Hooks customizados
  const { 
    categories, 
    loading: categoriesLoading,
    createCategory, 
    updateCategory, 
    deleteCategory 
  } = useCategories();

  const { 
    suppliers, 
    loading: suppliersLoading,
    createSupplier, 
    updateSupplier, 
    deleteSupplier 
  } = useSuppliers();

  const { 
    paymentMethods, 
    loading: paymentsLoading,
    createPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod 
  } = usePaymentMethods();

  // Estados para formulários
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Estados dos formulários
  const [categoryForm, setCategoryForm] = useState({
    name: '', type: 'expense', color: '#3B82F6', icon: 'circle', parent_id: null
  });
  const [supplierForm, setSupplierForm] = useState({
    name: '', type: 'supplier', document: '', email: '', phone: '', address: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    name: '', type: 'both', is_default: false
  });

  // Funções para Categorias
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    
    try {
      if (editingItem) {
        const { error } = await updateCategory(editingItem.id, categoryForm);
        if (error) throw new Error(error);
      } else {
        const { error } = await createCategory(categoryForm);
        if (error) throw new Error(error);
      }
      resetCategoryForm();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      alert('Erro ao salvar categoria: ' + error.message);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', type: 'expense', color: '#3B82F6', icon: 'circle', parent_id: null });
    setShowCategoryForm(false);
    setEditingItem(null);
  };

  const handleEditCategory = (category) => {
    setCategoryForm(category);
    setEditingItem(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        const { error } = await deleteCategory(id);
        if (error) throw new Error(error);
      } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        alert('Erro ao deletar categoria: ' + error.message);
      }
    }
  };

  // Funções para Fornecedores
  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) return;
    
    try {
      if (editingItem) {
        const { error } = await updateSupplier(editingItem.id, supplierForm);
        if (error) throw new Error(error);
      } else {
        const { error } = await createSupplier(supplierForm);
        if (error) throw new Error(error);
      }
      resetSupplierForm();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      alert('Erro ao salvar fornecedor: ' + error.message);
    }
  };

  const resetSupplierForm = () => {
    setSupplierForm({ name: '', type: 'supplier', document: '', email: '', phone: '', address: '' });
    setShowSupplierForm(false);
    setEditingItem(null);
  };

  const handleEditSupplier = (supplier) => {
    setSupplierForm(supplier);
    setEditingItem(supplier);
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor/cliente?')) {
      try {
        const { error } = await deleteSupplier(id);
        if (error) throw new Error(error);
      } catch (error) {
        console.error('Erro ao deletar fornecedor:', error);
        alert('Erro ao deletar fornecedor: ' + error.message);
      }
    }
  };

  // Funções para Métodos de Pagamento
  const handleSavePayment = async () => {
    if (!paymentForm.name.trim()) return;
    
    try {
      if (editingItem) {
        const { error } = await updatePaymentMethod(editingItem.id, paymentForm);
        if (error) throw new Error(error);
      } else {
        const { error } = await createPaymentMethod(paymentForm);
        if (error) throw new Error(error);
      }
      resetPaymentForm();
    } catch (error) {
      console.error('Erro ao salvar método de pagamento:', error);
      alert('Erro ao salvar método de pagamento: ' + error.message);
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({ name: '', type: 'both', is_default: false });
    setShowPaymentForm(false);
    setEditingItem(null);
  };

  const handleEditPayment = (payment) => {
    setPaymentForm(payment);
    setEditingItem(payment);
    setShowPaymentForm(true);
  };

  const handleDeletePayment = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este método de pagamento?')) {
      try {
        const { error } = await deletePaymentMethod(id);
        if (error) throw new Error(error);
      } catch (error) {
        console.error('Erro ao deletar método de pagamento:', error);
        alert('Erro ao deletar método de pagamento: ' + error.message);
      }
    }
  };

  // Renderizar categorias com hierarquia
  const renderCategoryTree = (parentId = null, level = 0) => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .map(category => (
        <div key={category.id} className={`ml-${level * 4}`}>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2 hover:bg-gray-100">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: category.color }}
              />
              <span className="font-medium text-gray-900">{category.name}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                category.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {category.type === 'income' ? 'Receita' : 'Despesa'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEditCategory(category)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {renderCategoryTree(category.id, level + 1)}
        </div>
      ));
  };

  const isLoading = categoriesLoading || suppliersLoading || paymentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // O resto do JSX permanece igual ao componente anterior...
  // [Incluir todo o JSX do componente anterior aqui]
}
