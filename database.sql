create datbase landing

create table login(
    id int IDENTITY(1,1) not null,
    nombre VARCHAR(250),
    email VARCHAR(250),
    pass varchar(250),
    phone varchar(250),
    code varchar(250),
    GPG TEXT,
    puesto varchar(250),
    CONSTRAINT pk_ad PRIMARY KEY(id)
)

create table role(
    id int,
    access_code varchar(3),
    CONSTRAINT pk_role PRIMARY KEY(id),
    CONSTRAINT fk_role FOREIGN KEY(id) REFERENCES login(id)
)

insert into login(nombre,email,pass,phone,code) values('ming', 'ming@ming.com', '$xxx31mmM', '55552222', '1111')
create table blacklist(
	mail varchar(250)
)

create table file_logs(
    mark datetime,
    event varchar(250),
    usuario int,
    file_name varchar(250),
    file_type varchar(250),
    name varchar(250),
    CONSTRAINT fk_file FOREIGN KEY(usuario) REFERENCES login(id)
)

create table files(
    id_origin varchar(250),
    id_dest varchar(250),
    file_name varchar(250),
    file_type varchar(250),
    name varchar(250),
)

create table PNC(
    requestor int,
    destiny int,
    reason TEXT,
    evidence varchar(250),
    timestamp varchar(250),
)

create trigger tg_set_role on login after insert 
AS
declare @id_user int = (select IDENT_CURRENT('login'))
insert into role values(@id_user, '100')


create PROCEDURE setRole @access_code varchar(3)
as
declare @id_user int = (select IDENT_CURRENT('login'))
insert into role values(@id_user, @access_code)

