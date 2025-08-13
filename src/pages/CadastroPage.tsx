import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, Building, CreditCard, User, Tag } from 'lucide-react';

// Simulando dados do Supabase - você substituirá pelas chamadas reais
const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000' };

const PAYMENT_METHODS_OPTIONS = [
  'PIX', 'BOLETO', 'CARTÃO DE CRÉDITO', 'CARTÃO DE DÉBITO', 'DINHEIRO',
  'TRANSFERÊNCIA', 'CHEQUE', 'REDE CARD', 'SITE', 'SHOPEE', 'MERCADOPAGO', 'DÉBITO EM CONTA'
];

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

const CATEGORY_ICONS = [
  'circle', 'home', 'car', 'shopping-cart', 'utensils', 'gamepad-2',
  'heart', 'briefcase', 'graduation-cap', 'plane', 'gift', 'music'
];

export default function CadastrosSection() {
  const [activeTab, setActiveTab] = useState('categorias');
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Simular carregamento inicial
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    // Simular dados - substitua pelas chamadas reais do Supabase
    setTimeout(() => {
      setCategories([
        { id: '1', name: 'Alimentação', type: 'expense', color: '#10B981', icon: 'utensils', parent_id: null },
        { id: '2', name: 'Restaurantes', type: 'expense', color: '#10B981', icon: 'utensils', parent_id: '1' },
        { id: '3', name: 'Salário', type: 'income', color: '#3B82F6', icon: 'briefcase', parent_id: null },
      ]);
      setSuppliers([
        { id: '1', name: 'Supermercado ABC', type: 'supplier', document: '12.345.678/0001-90' },
      ]);
      setPaymentMethods([
        { id: '1', name: 'PIX', type: 'both', is_default: true },
      ]);
      setLoading(false);
    }, 1000);
  };

  // Funções para Categorias
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    
    const newCategory = {
      id: Date.now().toString(),
      ...categoryForm,
      user_id: mockUser.id,
      created_at: new Date().toISOString()
    };

    if (editingItem) {
      setCategories(prev => prev.map(cat => 
        cat.id === editingItem.id ? { ...cat, ...categoryForm } : cat
      ));
    } else {
      setCategories(prev => [...prev, newCategory]);
    }

    resetCategoryForm();
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

  const handleDeleteCategory = (id) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  // Funções para Fornecedores/Clientes
  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) return;
    
    const newSupplier = {
      id: Date.now().toString(),
      ...supplierForm,
      user_id: mockUser.id,
      created_at: new Date().toISOString()
    };

    if (editingItem) {
      setSuppliers(prev => prev.map(sup => 
        sup.id === editingItem.id ? { ...sup, ...supplierForm } : sup
      ));
    } else {
      setSuppliers(prev => [...prev, newSupplier]);
    }

    resetSupplierForm();
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

  const handleDeleteSupplier = (id) => {
    setSuppliers(prev => prev.filter(sup => sup.id !== id));
  };

  // Funções para Métodos de Pagamento
  const handleSavePayment = async () => {
    if (!paymentForm.name.trim()) return;
    
    const newPayment = {
      id: Date.now().toString(),
      ...paymentForm,
      user_id: mockUser.id,
      created_at: new Date().toISOString()
    };

    if (editingItem) {
      setPaymentMethods(prev => prev.map(pay => 
        pay.id === editingItem.id ? { ...pay, ...paymentForm } : pay
      ));
    } else {
      setPaymentMethods(prev => [...prev, newPayment]);
    }

    resetPaymentForm();
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

  const handleDeletePayment = (id) => {
    setPaymentMethods(prev => prev.filter(pay => pay.id !== id));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-semibold text-gray-900">Cadastros</h1>
              <p className="text-gray-600 mt-1">Gerencie categorias, fornecedores e métodos de pagamento</p>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-8 px-6">
              {[
                { id: 'categorias', label: 'Plano de Contas', icon: Tag },
                { id: 'fornecedores', label: 'Fornecedores/Clientes', icon: User },
                { id: 'pagamentos', label: 'Formas de Pagamento', icon: CreditCard }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Tab Categorias */}
            {activeTab === 'categorias' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Plano de Contas</h2>
                  <button
                    onClick={() => setShowCategoryForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Categoria</span>
                  </button>
                </div>

                {/* Formulário de Categoria */}
                {showCategoryForm && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                        <input
                          type="text"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Nome da categoria"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                        <select
                          value={categoryForm.type}
                          onChange={(e) => setCategoryForm({...categoryForm, type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="expense">Despesa</option>
                          <option value="income">Receita</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria Pai</label>
                        <select
                          value={categoryForm.parent_id || ''}
                          onChange={(e) => setCategoryForm({...categoryForm, parent_id: e.target.value || null})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Categoria Principal</option>
                          {categories.filter(cat => !cat.parent_id).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                        <div className="flex space-x-2">
                          {CATEGORY_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setCategoryForm({...categoryForm, color})}
                              className={`w-8 h-8 rounded-full border-2 ${
                                categoryForm.color === color ? 'border-gray-900' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={resetCategoryForm}
                        className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        <X className="w-4 h-4 mr-2 inline" />
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveCategory}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2 inline" />
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Categorias */}
                <div className="space-y-2">
                  {renderCategoryTree()}
                </div>
              </div>
            )}

            {/* Tab Fornecedores */}
            {activeTab === 'fornecedores' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Fornecedores e Clientes</h2>
                  <button
                    onClick={() => setShowSupplierForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Fornecedor/Cliente</span>
                  </button>
                </div>

                {/* Formulário de Fornecedor */}
                {showSupplierForm && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                        <input
                          type="text"
                          value={supplierForm.name}
                          onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Nome do fornecedor/cliente"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                        <select
                          value={supplierForm.type}
                          onChange={(e) => setSupplierForm({...supplierForm, type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="supplier">Fornecedor</option>
                          <option value="client">Cliente</option>
                          <option value="both">Ambos</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Documento</label>
                        <input
                          type="text"
                          value={supplierForm.document}
                          onChange={(e) => setSupplierForm({...supplierForm, document: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="CPF/CNPJ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={resetSupplierForm}
                        className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        <X className="w-4 h-4 mr-2 inline" />
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveSupplier}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2 inline" />
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Fornecedores */}
                <div className="grid gap-4">
                  {suppliers.map(supplier => (
                    <div key={supplier.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                        <p className="text-sm text-gray-500">{supplier.document}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                          supplier.type === 'supplier' ? 'bg-blue-100 text-blue-800' :
                          supplier.type === 'client' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {supplier.type === 'supplier' ? 'Fornecedor' : 
                           supplier.type === 'client' ? 'Cliente' : 'Ambos'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditSupplier(supplier)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Pagamentos */}
            {activeTab === 'pagamentos' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Formas de Pagamento</h2>
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Forma de Pagamento</span>
                  </button>
                </div>

                {/* Formulário de Pagamento */}
                {showPaymentForm && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                        <select
                          value={paymentForm.name}
                          onChange={(e) => setPaymentForm({...paymentForm, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Selecione uma opção</option>
                          {PAYMENT_METHODS_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                        <select
                          value={paymentForm.type}
                          onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="payment">Apenas Pagamento</option>
                          <option value="receipt">Apenas Recebimento</option>
                          <option value="both">Ambos</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={paymentForm.is_default}
                          onChange={(e) => setPaymentForm({...paymentForm, is_default: e.target.checked})}
                          className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Forma de pagamento padrão</label>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={resetPaymentForm}
                        className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        <X className="w-4 h-4 mr-2 inline" />
                        Cancelar
                      </button>
                      <button
                        onClick={handleSavePayment}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2 inline" />
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Métodos de Pagamento */}
                <div className="grid gap-4">
                  {paymentMethods.map(method => (
                    <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <h3 className="font-medium text-gray-900">{method.name}</h3>
                          <div className="flex space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              method.type === 'payment' ? 'bg-red-100 text-red-800' :
                              method.type === 'receipt' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {method.type === 'payment' ? 'Pagamento' : 
                               method.type === 'receipt' ? 'Recebimento' : 'Ambos'}
                            </span>
                            {method.is_default && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Padrão
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPayment(method)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePayment(method.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
