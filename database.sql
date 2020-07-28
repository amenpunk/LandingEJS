create datbase landing
create table login(
    id int IDENTITY(1,1) not null,
    nombre VARCHAR(250),
    email VARCHAR(250),
    pass varchar(250),
    CONSTRAINT pk_ad PRIMARY KEY(id)
)
