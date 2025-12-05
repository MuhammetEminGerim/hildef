import { Textarea } from '../components/ui/textarea';
import { useEvents } from '../hooks/use-events';

export default function EventsPage() {
  const { events, loading, addEvent, updateEvent, deleteEvent } = useEvents();
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const { toast } = useToast();

  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
  });

  const filteredEvents = useMemo(() => {
    let filtered = events;

    const term = search.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(term) ||
          (event.location && event.location.toLowerCase().includes(term)) ||
          event.event_date.includes(term)
      );
    }

    return filtered.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  }, [events, search]);

  function resetForm() {
    setEventForm({
      name: '',
      description: '',
      event_date: getLocalToday(),
      event_time: '',
      location: '',
    });
  }

  function openEditDialog(event: any) {
    setSelectedEvent(event);
    setEventForm({
      name: event.name,
      description: event.description || '',
      event_date: event.event_date,
      event_time: event.event_time || '',
      location: event.location || '',
    });
    setIsEditDialogOpen(true);
  }

  async function handleCreateEvent() {
    if (!eventForm.name || !eventForm.event_date) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Etkinlik adı ve tarihi zorunludur',
      });
      return;
    }

    try {
      await addEvent({
        name: eventForm.name,
        description: eventForm.description,
        event_date: eventForm.event_date,
        event_time: eventForm.event_time,
        location: eventForm.location,
      });

      toast({
        title: 'Başarılı',
        description: 'Etkinlik oluşturuldu',
      });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Etkinlik oluşturulamadı',
      });
    }
  }

  async function handleUpdateEvent() {
    if (!selectedEvent || !eventForm.name || !eventForm.event_date) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Etkinlik adı ve tarihi zorunludur',
      });
      return;
    }

    try {
      await updateEvent(selectedEvent.id, {
        name: eventForm.name,
        description: eventForm.description,
        event_date: eventForm.event_date,
        event_time: eventForm.event_time,
        location: eventForm.location,
      });

      toast({
        title: 'Başarılı',
        description: 'Etkinlik güncellendi',
      });

      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      resetForm();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Etkinlik güncellenemedi',
      });
    }
  }

  async function handleDeleteEvent(id: string) {
    if (!window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;

    try {
      await deleteEvent(id);
      toast({
        title: 'Başarılı',
        description: 'Etkinlik silindi',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: e.message || 'Etkinlik silinemedi',
      });
    }
  }

  function formatEventDateTime(event: any): string {
    const date = new Date(event.event_date);
    const dateStr = date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (event.event_time) {
      return `${dateStr}, ${event.event_time}`;
    }
    return dateStr;
  }

  return (
    <div className="flex flex-col gap-8 text-[#111813]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Etkinlikler</h2>
          <p className="text-sm text-[#3e5c45]">Planlanmış ve geçmiş etkinlikleri yönetin.</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
          className="h-11 rounded-xl bg-[#13ec49] hover:bg-[#0fdc41] text-[#102915] font-semibold gap-2 px-5"
        >
          <Plus className="h-4 w-4" />
          Yeni Etkinlik
        </Button>
      </motion.div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8aa692]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Etkinlik ara..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-[24px] border border-[#b0c4b1] bg-white">
        {loading ? (
          <div className="text-center py-12 text-[#3e5c45]">Yükleniyor...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-[#3e5c45]">
            {search
              ? 'Arama kriterlerinize uygun etkinlik bulunamadı.'
              : 'Henüz etkinlik bulunmuyor.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="group relative flex flex-col gap-4 rounded-xl border border-[#e0ede3] bg-[#f8fdf8] p-5 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[#111813]">{event.name}</h3>
                    <p className="text-sm text-[#3e5c45] mt-1">{formatEventDateTime(event)}</p>
                    {event.location && (
                      <p className="text-sm text-[#3e5c45] mt-0.5">{event.location}</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-[#3e5c45] hover:text-[#111813] hover:bg-[#e0ede3]"
                      onClick={() => openEditDialog(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-[#c62828] hover:text-[#b71c1c] hover:bg-[#ffebee]"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {event.description && (
                  <p className="text-sm text-[#3e5c45] line-clamp-2">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Etkinlik</DialogTitle>
            <DialogDescription>
              Yeni bir etkinlik oluşturmak için aşağıdaki formu doldurun.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Etkinlik Adı</Label>
              <Input
                id="name"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Tarih</Label>
                <Input
                  id="date"
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Saat</Label>
                <Input
                  id="time"
                  type="time"
                  value={eventForm.event_time}
                  onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Konum</Label>
              <Input
                id="location"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleCreateEvent}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Etkinliği Düzenle</DialogTitle>
            <DialogDescription>
              Etkinlik bilgilerini güncellemek için aşağıdaki formu kullanın.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Etkinlik Adı</Label>
              <Input
                id="edit-name"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Tarih</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-time">Saat</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={eventForm.event_time}
                  onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Konum</Label>
              <Input
                id="edit-location"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Açıklama</Label>
              <Textarea
                id="edit-description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleUpdateEvent}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
