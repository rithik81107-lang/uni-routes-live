
CREATE TABLE public.buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number text NOT NULL UNIQUE,
  route_name text NOT NULL,
  driver_name text NOT NULL,
  driver_phone text NOT NULL,
  capacity int NOT NULL DEFAULT 45,
  departure_time text NOT NULL DEFAULT '07:30',
  color text NOT NULL DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.buses TO anon, authenticated;
GRANT ALL ON public.buses TO service_role;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buses are viewable by everyone" ON public.buses FOR SELECT USING (true);

CREATE TABLE public.stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  area text NOT NULL DEFAULT '',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stops TO anon, authenticated;
GRANT ALL ON public.stops TO service_role;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stops are viewable by everyone" ON public.stops FOR SELECT USING (true);

CREATE TABLE public.route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  stop_id uuid NOT NULL REFERENCES public.stops(id) ON DELETE CASCADE,
  stop_order int NOT NULL,
  offset_minutes int NOT NULL DEFAULT 0,
  UNIQUE (bus_id, stop_order)
);
GRANT SELECT ON public.route_stops TO anon, authenticated;
GRANT ALL ON public.route_stops TO service_role;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Route stops are viewable by everyone" ON public.route_stops FOR SELECT USING (true);

CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid REFERENCES public.buses(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.alerts TO anon, authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alerts are viewable by everyone" ON public.alerts FOR SELECT USING (true);

CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  phone text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.emergency_contacts TO anon, authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Emergency contacts are viewable by everyone" ON public.emergency_contacts FOR SELECT USING (true);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  roll_number text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  selected_bus_id uuid REFERENCES public.buses(id) ON DELETE SET NULL,
  selected_stop_id uuid REFERENCES public.stops(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, roll_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'roll_number', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.stops (name, area, lat, lng) VALUES
('College Main Gate','Campus',22.5726,88.3639),
('Salt Lake Sector V','Bidhannagar',22.5697,88.4336),
('Karunamoyee','Salt Lake',22.5789,88.4090),
('Ultadanga','North Kolkata',22.5958,88.3986),
('Sealdah Station','Central',22.5675,88.3707),
('Howrah Station','Howrah',22.5839,88.3425),
('Shibpur','Howrah',22.5590,88.3200),
('Esplanade','Central',22.5645,88.3510),
('Park Street','Central',22.5525,88.3520),
('Behala Chowrasta','South West',22.4986,88.3117),
('Taratala','South West',22.5150,88.3050),
('New Alipore','South',22.5090,88.3300),
('Dum Dum Junction','North',22.6210,88.4200),
('Lake Town','North',22.6060,88.4110),
('Belgachia','North',22.6000,88.3800),
('Garia Bus Stand','South',22.4650,88.3900),
('Jadavpur 8B','South',22.4990,88.3710),
('Rashbehari','South',22.5140,88.3480),
('Ruby Crossing','East',22.5140,88.4010),
('Science City','East',22.5400,88.3960);

INSERT INTO public.buses (bus_number, route_name, driver_name, driver_phone, capacity, departure_time, color) VALUES
('CB-01','Salt Lake Loop','Anil Ghosh','+91 98300 11101',45,'07:15','route1'),
('CB-02','Howrah Express','Sunil Das','+91 98300 11102',50,'07:00','route2'),
('CB-03','Behala Line','Rakesh Roy','+91 98300 11103',42,'07:20','route3'),
('CB-04','Dum Dum Circuit','Pradip Sen','+91 98300 11104',48,'06:50','route4'),
('CB-05','Garia Link','Manoj Pal','+91 98300 11105',40,'07:10','route5');

INSERT INTO public.route_stops (bus_id, stop_id, stop_order, offset_minutes)
SELECT b.id, s.id, v.ord, v.mins
FROM (VALUES
 ('CB-01','Salt Lake Sector V',1,0),
 ('CB-01','Karunamoyee',2,8),
 ('CB-01','Ultadanga',3,18),
 ('CB-01','Science City',4,30),
 ('CB-01','College Main Gate',5,45),
 ('CB-02','Howrah Station',1,0),
 ('CB-02','Shibpur',2,10),
 ('CB-02','Esplanade',3,22),
 ('CB-02','Sealdah Station',4,33),
 ('CB-02','College Main Gate',5,45),
 ('CB-03','Behala Chowrasta',1,0),
 ('CB-03','Taratala',2,9),
 ('CB-03','New Alipore',3,17),
 ('CB-03','Rashbehari',4,28),
 ('CB-03','College Main Gate',5,45),
 ('CB-04','Dum Dum Junction',1,0),
 ('CB-04','Lake Town',2,9),
 ('CB-04','Belgachia',3,18),
 ('CB-04','Ultadanga',4,26),
 ('CB-04','College Main Gate',5,42),
 ('CB-05','Garia Bus Stand',1,0),
 ('CB-05','Jadavpur 8B',2,12),
 ('CB-05','Ruby Crossing',3,22),
 ('CB-05','Park Street',4,34),
 ('CB-05','College Main Gate',5,48)
) AS v(bus, stop, ord, mins)
JOIN public.buses b ON b.bus_number = v.bus
JOIN public.stops s ON s.name = v.stop;

INSERT INTO public.alerts (bus_id, kind, title, message)
SELECT b.id, v.kind, v.title, v.message
FROM (VALUES
 ('CB-02','delay','CB-02 running 12 min late','Heavy traffic near Howrah Bridge. Expect a 12 minute delay this morning.'),
 ('CB-04','route','CB-04 route changed','Belgachia flyover repair work. The bus will use the VIP Road diversion today.'),
 ('CB-01','info','CB-01 on time','All stops on the Salt Lake Loop are running to schedule.'),
 ('CB-05','delay','CB-05 delayed by 6 min','Waterlogging near Ruby Crossing is slowing traffic.')
) AS v(bus, kind, title, message)
JOIN public.buses b ON b.bus_number = v.bus;

INSERT INTO public.emergency_contacts (label, phone, description, sort_order) VALUES
('Campus Security','+91 98300 90001','24x7 campus security control room',1),
('Transport Office','+91 98300 90002','Bus scheduling and lost items',2),
('Medical Room','+91 98300 90003','On-campus first aid and ambulance',3),
('Police Helpline','100','National emergency police number',4);
